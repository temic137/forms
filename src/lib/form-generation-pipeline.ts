/**
 * Form Generation Pipeline
 * 
 * Multi-model orchestration for high-quality form generation:
 * - Stage 1: Content Analysis (fast model)
 * - Stage 2: Form Structure Generation (high-quality model)
 * - Stage 3+4: Field Optimization + Question Enhancement (parallel)
 * 
 * With smart stage skipping for latency optimization
 */

import { getAICompletion, GEMINI_MODELS } from './ai-provider';
import { ModelPurpose } from './ai-models';
import { analyzeFieldTypes, FULL_FIELD_PALETTE, FieldTypeKey } from './semantic-field-analyzer';
import { enhanceQuestionsWithAI } from './question-enhancer';

// ============================================================================
// HELPER: ROBUST JSON PARSING
// ============================================================================

function cleanAndParseJSON(text: string, context: string): unknown {
  if (!text) {
    throw new Error(`Empty response received from AI in ${context}`);
  }

  // 1. Try direct parse
  try {
    return JSON.parse(text);
  } catch {
    // Continue to cleanup
  }

  // 2. Extract JSON from markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch {
      // Continue
    }
  }

  // 3. Find first { and last } to handle surrounding text
  const firstOpen = text.indexOf('{');
  const lastClose = text.lastIndexOf('}');
  
  if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
    const cleaned = text.substring(firstOpen, lastClose + 1);
    try {
      return JSON.parse(cleaned);
    } catch {
      // Continue
    }
  }

  // 4. If we're here, parsing failed. Log the content for debugging.
  console.error(`❌ JSON Parse Failed in ${context}:`);
  console.error(`   Content length: ${text.length}`);
  console.error(`   Preview: ${text.substring(0, 200)}...`);
  console.error(`   End: ...${text.substring(text.length - 200)}`);
  
  throw new Error(`Failed to parse JSON in ${context}. See logs for content.`);
}

// ============================================================================
// PIPELINE TYPES
// ============================================================================

export interface PipelineInput {
  prompt: string;
  userContext?: string;
  questionCount?: number;
  referenceData?: string; // For quizzes with reference material
}

export interface FormField {
  id: string;
  label: string;
  type: FieldTypeKey;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[];
  validation?: Record<string, unknown>;
  quizConfig?: {
    correctAnswer: string | string[];
    points: number;
    explanation: string;
  };
  order: number;
}

export interface GeneratedForm {
  title: string;
  description?: string;
  fields: FormField[];
  quizMode?: {
    enabled: boolean;
    showScoreImmediately: boolean;
    showCorrectAnswers: boolean;
    showExplanations: boolean;
    passingScore: number;
  };
  metadata: {
    formType: string;
    domain: string;
    tone: string;
    complexity: string;
    pipeline: {
      stages: string[];
      totalLatencyMs: number;
      modelsUsed: string[];
    };
  };
}

export interface ContentAnalysis {
  purpose: string;
  audience: string;
  domain: string;
  formType: string;
  isQuiz: boolean;
  isSurvey: boolean;
  tone: string;
  complexity: 'simple' | 'moderate' | 'complex';
  keyTopics: string[];
  essentialFields: string[];
  strategicFields: string[];
  confidence: number;
}

// ============================================================================
// PIPELINE CONFIGURATION
// ============================================================================

export interface PipelineConfig {
  skipFieldOptimization?: boolean;
  skipQuestionEnhancement?: boolean;
  parallelOptimization?: boolean;
  maxLatencyMs?: number;
  tone?: 'professional' | 'friendly' | 'casual' | 'formal';
}

const DEFAULT_CONFIG: PipelineConfig = {
  skipFieldOptimization: false,
  skipQuestionEnhancement: false,
  parallelOptimization: true,
  maxLatencyMs: 8000,
  tone: 'professional',
};

// ============================================================================
// STAGE 1: CONTENT ANALYSIS
// ============================================================================

async function analyzeContent(prompt: string, userContext?: string, model: string = GEMINI_MODELS.FLASH_LITE): Promise<ContentAnalysis> {
  const systemPrompt = `You are an expert form strategist. Analyze the user's request to understand:
1. What type of form they need
2. Who the audience is
3. What domain/industry this is for
4. Key topics and fields to include
5. Appropriate tone and complexity

FORM TYPE DETECTION:
- quiz/test/exam/trivia/assessment → isQuiz: true
- survey/questionnaire/feedback/poll → isSurvey: true
- contact/inquiry/message → formType: "contact"
- registration/signup/enroll → formType: "registration"
- booking/appointment/reservation → formType: "booking"
- order/purchase/checkout → formType: "order"
- application/apply/job → formType: "application"
- rsvp/event/attendance → formType: "rsvp"
- donation/contribute/fundraise → formType: "donation"
- review/rating/testimonial → formType: "review"

Return ONLY valid JSON.`;

  const userPrompt = `Analyze this form request:

"${prompt}"

${userContext ? `Additional context: ${userContext}` : ''}

Return JSON:
{
  "purpose": "Clear explanation of form purpose",
  "audience": "Target audience description",
  "domain": "healthcare|education|business|finance|legal|retail|events|general",
  "formType": "quiz|survey|contact|registration|booking|order|application|rsvp|donation|review|general",
  "isQuiz": true/false,
  "isSurvey": true/false,
  "tone": "professional|friendly|casual|formal",
  "complexity": "simple|moderate|complex",
  "keyTopics": ["topic1", "topic2"],
  "essentialFields": ["field1", "field2"],
  "strategicFields": ["insight-field1", "insight-field2"],
  "confidence": 0.0-1.0
}`;

  const result = await getAICompletion({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
    maxTokens: 1500,
    responseFormat: 'json',
    model: model
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parsed = cleanAndParseJSON(result.content, 'analyzeContent') as any;

  return {
    purpose: parsed.purpose || 'Form data collection',
    audience: parsed.audience || 'General users',
    domain: parsed.domain || 'general',
    formType: parsed.formType || 'general',
    isQuiz: parsed.isQuiz || false,
    isSurvey: parsed.isSurvey || false,
    tone: parsed.tone || 'professional',
    complexity: parsed.complexity || 'moderate',
    keyTopics: parsed.keyTopics || [],
    essentialFields: parsed.essentialFields || [],
    strategicFields: parsed.strategicFields || [],
    confidence: parsed.confidence || 0.7,
  };
}

// ============================================================================
// STAGE 2: FORM GENERATION
// ============================================================================

function buildFieldPaletteReference(): string {
  const categories = new Map<string, string[]>();

  for (const [type, config] of Object.entries(FULL_FIELD_PALETTE)) {
    if ('isInput' in config && config.isInput === false) continue;
    
    const cat = config.category;
    if (!categories.has(cat)) categories.set(cat, []);
    
    const useWhen = config.useWhen || '';
    categories.get(cat)!.push(`  - "${type}": ${config.description} → Use when: ${useWhen}`);
  }

  let reference = 'AVAILABLE FIELD TYPES (use these EXACT type names):\n';
  for (const [category, types] of categories) {
    reference += `\n### ${category}\n${types.join('\n')}\n`;
  }
  return reference;
}

async function generateFormStructure(
  prompt: string,
  analysis: ContentAnalysis,
  questionCount?: number,
  referenceData?: string,
  model?: string
): Promise<{ title: string; fields: FormField[]; quizMode?: GeneratedForm['quizMode'] }> {
  
  // Enhanced logging to debug reference data
  console.log('   📄 generateFormStructure called:');
  console.log(`      • Prompt length: ${prompt.length} chars`);
  console.log(`      • Reference data received: ${referenceData ? 'YES (' + referenceData.length + ' chars)' : 'NO (undefined or empty)'}`);
  if (referenceData) {
    console.log(`      • Reference data preview: "${referenceData.substring(0, 200)}..."`);
  }
  
  const fieldPalette = buildFieldPaletteReference();

  // Build a truly dynamic, holistic understanding system prompt
  const systemPrompt = `You are an intelligent form generation AI with exceptional natural language understanding.

═══════════════════════════════════════════════════════════════════════════════════
                        CORE DIRECTIVE: HOLISTIC UNDERSTANDING
═══════════════════════════════════════════════════════════════════════════════════

Your ONLY job is to READ, UNDERSTAND, and DELIVER exactly what the user asks for.

DO NOT:
- Add extra questions the user didn't ask for
- Change the topic or scope
- Apply rigid templates or assumptions
- Override user specifications with defaults
- Add "strategic" or "insightful" questions unless asked

DO:
- Parse the ENTIRE request to understand the complete intent
- Generate EXACTLY what was requested (number of questions, topic, style, everything)
- If user says "5 questions about X" → generate exactly 5 questions about X
- If user says "simple contact form" → generate a simple contact form, not an elaborate one
- If user says "quiz on photosynthesis" → generate knowledge questions about photosynthesis
- Match the user's implied complexity and scope

═══════════════════════════════════════════════════════════════════════════════════
                              AVAILABLE FIELD TYPES
═══════════════════════════════════════════════════════════════════════════════════

${fieldPalette}

═══════════════════════════════════════════════════════════════════════════════════
                              SMART FIELD TYPE SELECTION
═══════════════════════════════════════════════════════════════════════════════════

Choose the MOST appropriate field type based on the question's semantic meaning:
- Email questions → "email" (not text)
- Phone numbers → "phone" (not text)
- Yes/No questions → "switch" or "radio" with Yes/No options
- Rating 1-5 → "star-rating"
- Agreement scales → "opinion-scale"
- Single choice from options → "multiple-choice" or "dropdown" (based on # of options)
- Multiple selections → "checkboxes"
- Long text/explanations → "long-answer"
- Short text/names → "short-answer"
- Dates → "date-picker"
- Files/uploads → "file-uploader"

For QUIZZES/TESTS specifically:
- Use "multiple-choice" or "checkboxes" only
- Include quizConfig with correctAnswer, points (default 1), and explanation
- Generate actual KNOWLEDGE questions, not opinion or preference questions

═══════════════════════════════════════════════════════════════════════════════════
                                   OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════════

Return valid JSON:
{
  "title": "Descriptive title matching user's request",
  "quizMode": { // ONLY include for quizzes/tests
    "enabled": true,
    "showScoreImmediately": true,
    "showCorrectAnswers": true,
    "showExplanations": true,
    "passingScore": 70
  },
  "fields": [
    {
      "id": "field_1",
      "label": "Question or field label",
      "type": "appropriate-field-type",
      "required": true/false,
      "options": ["if", "applicable"],
      "placeholder": "helpful hint",
      "helpText": "additional guidance",
      "quizConfig": { // ONLY for quiz questions
        "correctAnswer": "exact option text or array for checkboxes",
        "points": 1,
        "explanation": "why this is correct"
      },
      "order": 0
    }
  ]
}`;

  // Build a user prompt that passes through the request cleanly
  const userPrompt = `USER'S REQUEST:
"${prompt}"

${referenceData ? `
══════════════════════════════════════════════════════════════════════════════
                    📚 REFERENCE MATERIAL - USE THIS AS YOUR SOURCE
══════════════════════════════════════════════════════════════════════════════

The user has provided this reference content. Your form MUST be based on/about this content:

"""
${referenceData.substring(0, 8000)}
"""

CRITICAL: This reference material defines WHAT the form should be about. 
- If it's a product/service → ask questions ABOUT that specific product/service
- If it's educational content → create questions FROM that content
- If it's a company/website → make the form relevant to THAT company/website
- Extract specific names, features, topics from the reference and use them in your questions

DO NOT create a generic form. Create a form that is SPECIFICALLY about the reference content above.
` : ''}

UNDERSTAND THE REQUEST AND GENERATE EXACTLY WHAT WAS ASKED FOR.
- If a specific number of questions/fields was mentioned, generate that exact number
- If reference material was provided, the form MUST be specifically about that content
- If complexity was implied, match it
- Do not add unrequested fields or questions

Return the form as valid JSON.`;

  // Log the final prompt being sent to AI
  console.log('   📝 Final prompt to AI:');
  console.log(`      • Contains reference material: ${referenceData ? 'YES' : 'NO'}`);
  console.log(`      • Total prompt length: ${userPrompt.length} chars`);

  // Use different model for quizzes with reference data (needs high token limit)
  // Use Gemini 3 Pro Preview for complex generation when needed
  const purpose: ModelPurpose = (analysis.isQuiz && referenceData) ? 'quiz-generation' : 'form-generation';
  const effectiveModel = (analysis.isQuiz && referenceData) ? GEMINI_MODELS.THREE_PRO : model;
  console.log(`   🎯 Model purpose: ${purpose} (Using: ${effectiveModel})`);

  const result = await getAICompletion({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: analysis.isQuiz ? 0.4 : 0.3,
    maxTokens: 4000, // Reduced from 6000 to avoid timeouts
    responseFormat: 'json',
    model: effectiveModel // Use Gemini 3 Pro for complex tasks, or passed model (Gemini 3 Flash)
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parsed = cleanAndParseJSON(result.content, 'generateFormStructure') as any;

  // Normalize fields
  const fields: FormField[] = (parsed.fields || []).map((f: Record<string, unknown>, idx: number) => {
    const field: FormField = {
      id: (f.id as string) || `field_${idx}`,
      label: (f.label as string) || 'Field',
      type: (f.type as FieldTypeKey) || 'short-answer',
      required: f.required !== false,
      placeholder: f.placeholder as string | undefined,
      helpText: f.helpText as string | undefined,
      options: f.options as string[] | undefined,
      validation: f.validation as Record<string, unknown> | undefined,
      quizConfig: f.quizConfig as FormField['quizConfig'] | undefined,
      order: idx,
    };

    // Remove helpText and placeholder from quiz questions
    if (analysis.isQuiz && field.quizConfig) {
      field.helpText = undefined;
      field.placeholder = undefined;
    }

    return field;
  });

  return {
    title: parsed.title || 'Untitled Form',
    fields,
    quizMode: parsed.quizMode,
  };
}

// ============================================================================
// STAGE 3: FIELD TYPE OPTIMIZATION
// ============================================================================

async function optimizeFieldTypes(
  fields: FormField[],
  formContext: string
): Promise<FormField[]> {
  console.log('      → Analyzing', fields.length, 'fields for optimal types...');
  
  // Prepare fields for analysis
  const fieldsToAnalyze = fields.map(f => ({
    label: f.label,
    currentType: f.type,
    options: f.options,
    helpText: f.helpText,
    context: formContext,
  }));

  // Run batch analysis
  const analyses = await analyzeFieldTypes(fieldsToAnalyze, formContext);

  // Apply optimizations
  let upgradeCount = 0;
  const result = fields.map((field, idx) => {
    const analysis = analyses[idx];
    
    // Check if this is a type upgrade
    const isTypeUpgrade = analysis.confidence >= 0.7 && analysis.recommendedType !== field.type;
    
    // For multiple-choice fields, ensure we apply suggested options if the current field has empty options
    const needsOptions = (analysis.recommendedType === 'multiple-choice' || field.type === 'multiple-choice') &&
                         analysis.suggestedOptions && 
                         analysis.suggestedOptions.length > 0 &&
                         (!field.options || field.options.length === 0 || field.options.every(o => !o || o.trim() === '' || o.startsWith('Option ')));
    
    if (isTypeUpgrade || needsOptions) {
      if (isTypeUpgrade) {
        upgradeCount++;
        console.log(`      🔄 Upgrade: "${field.label.substring(0, 30)}..." ${field.type} → ${analysis.recommendedType} (confidence: ${(analysis.confidence * 100).toFixed(0)}%)`);
      }
      if (needsOptions && !isTypeUpgrade) {
        console.log(`      📝 Options: "${field.label.substring(0, 30)}..." added ${analysis.suggestedOptions?.length || 0} options`);
      }
      
      // Build updated quiz config if we have a suggested correct answer
      let updatedQuizConfig = field.quizConfig;
      if (analysis.suggestedCorrectAnswer && formContext.toLowerCase().includes('quiz')) {
        updatedQuizConfig = {
          ...field.quizConfig,
          correctAnswer: analysis.suggestedCorrectAnswer,
          points: field.quizConfig?.points || 1,
          explanation: field.quizConfig?.explanation || '',
        };
        console.log(`      ✅ Correct: "${field.label.substring(0, 25)}..." → "${analysis.suggestedCorrectAnswer.substring(0, 20)}..."`);
      }
      
      return {
        ...field,
        type: isTypeUpgrade ? analysis.recommendedType : field.type,
        placeholder: analysis.suggestedPlaceholder || field.placeholder,
        helpText: analysis.suggestedHelpText || field.helpText,
        options: analysis.suggestedOptions || field.options,
        quizConfig: updatedQuizConfig,
      };
    }

    return field;
  });
  
  console.log(`      → Field optimization complete: ${upgradeCount} upgrades applied`);
  return result;
}

// ============================================================================
// STAGE 4: QUESTION ENHANCEMENT
// ============================================================================

async function enhanceQuestions(
  fields: FormField[],
  analysis: ContentAnalysis,
  config: PipelineConfig
): Promise<FormField[]> {
  // Prepare questions for enhancement
  const questions = fields.map(f => ({
    label: f.label,
    type: f.type,
    helpText: f.helpText,
    placeholder: f.placeholder,
    options: f.options,
    context: analysis.formType,
  }));

  // Run enhancement
  const enhanced = await enhanceQuestionsWithAI(questions, {
    tone: config.tone || (analysis.tone as 'professional' | 'friendly' | 'casual' | 'formal'),
    formType: analysis.formType,
    audience: analysis.audience,
  });

  // Apply enhancements
  return fields.map((field, idx) => {
    const enhancement = enhanced[idx];
    
    return {
      ...field,
      label: enhancement.label || field.label,
      helpText: enhancement.helpText || field.helpText,
      placeholder: enhancement.placeholder || field.placeholder,
      options: enhancement.options || field.options,
    };
  });
}

// ============================================================================
// MAIN PIPELINE
// ============================================================================

export async function runFormGenerationPipeline(
  input: PipelineInput,
  config: PipelineConfig = DEFAULT_CONFIG
): Promise<GeneratedForm> {
  const startTime = Date.now();
  const stagesCompleted: string[] = [];
  const modelsUsed: string[] = [];

  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                    🚀 MULTI-MODEL FORM GENERATION PIPELINE                   ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  console.log(`📝 Input prompt: "${input.prompt.substring(0, 80)}${input.prompt.length > 80 ? '...' : ''}"`);
  console.log(`🔢 Requested questions: ${input.questionCount || 'auto'}`);
  console.log(`📚 Reference data: ${input.referenceData ? 'YES (' + input.referenceData.length + ' chars)' : 'NO'}`);
  console.log('─'.repeat(80));

  // ════════════════════════════════════════════════════════════════════════
  // STAGE 1: Content Analysis (Sequential - must complete first)
  // ════════════════════════════════════════════════════════════════════════
  console.log('\n📊 STAGE 1: CONTENT ANALYSIS');
  console.log(`   🤖 Model: ${GEMINI_MODELS.THREE_FLASH} (fast classifier)`);
  const stage1Start = Date.now();
  
  // Use Gemini 3 Flash Preview for analysis
  const analysis = await analyzeContent(input.prompt, input.userContext, GEMINI_MODELS.THREE_FLASH);
  
  const stage1Time = Date.now() - stage1Start;
  stagesCompleted.push('content-analysis');
  modelsUsed.push(GEMINI_MODELS.THREE_FLASH);

  console.log(`   ⏱️  Completed in ${stage1Time}ms`);
  console.log(`   📋 Results:`);
  console.log(`      • Form Type: ${analysis.formType.toUpperCase()}`);
  console.log(`      • Is Quiz: ${analysis.isQuiz ? '✅ YES' : '❌ NO'}`);
  console.log(`      • Is Survey: ${analysis.isSurvey ? '✅ YES' : '❌ NO'}`);
  console.log(`      • Domain: ${analysis.domain}`);
  console.log(`      • Tone: ${analysis.tone}`);
  console.log(`      • Complexity: ${analysis.complexity}`);
  console.log(`      • Confidence: ${(analysis.confidence * 100).toFixed(0)}%`);
  console.log(`      • Key Topics: ${analysis.keyTopics.slice(0, 3).join(', ') || 'none detected'}`);
  console.log(`      • Essential Fields: ${analysis.essentialFields.slice(0, 3).join(', ') || 'none detected'}`);

  // Determine if we should skip optional stages (latency optimization)
  const isSimpleForm = analysis.complexity === 'simple' && !analysis.isQuiz && !analysis.isSurvey;
  const shouldSkipOptimization = config.skipFieldOptimization || isSimpleForm;
  const shouldSkipEnhancement = config.skipQuestionEnhancement || isSimpleForm;

  // ════════════════════════════════════════════════════════════════════════
  // STAGE 2: Form Structure Generation (Sequential - needs analysis)
  // ════════════════════════════════════════════════════════════════════════
  // Use Gemini 3 Flash Preview as primary high-performance generator
  const stage2Model = GEMINI_MODELS.THREE_FLASH;
  console.log('\n🏗️  STAGE 2: FORM STRUCTURE GENERATION');
  console.log(`   🤖 Model: ${stage2Model} (high-quality generator)`);
  const stage2Start = Date.now();
  
  // Pass model to generateFormStructure
  const { title, fields: rawFields, quizMode } = await generateFormStructure(
    input.prompt,
    analysis,
    input.questionCount,
    input.referenceData,
    stage2Model
  );
  const stage2Time = Date.now() - stage2Start;
  stagesCompleted.push('form-generation');
  modelsUsed.push(stage2Model);

  console.log(`   ⏱️  Completed in ${stage2Time}ms`);
  console.log(`   📋 Results:`);
  console.log(`      • Title: "${title}"`);
  console.log(`      • Fields Generated: ${rawFields.length}`);
  console.log(`      • Quiz Mode: ${quizMode?.enabled ? '✅ ENABLED' : '❌ DISABLED'}`);
  
  // Log field type distribution
  const typeCount: Record<string, number> = {};
  rawFields.forEach(f => { typeCount[f.type] = (typeCount[f.type] || 0) + 1; });
  console.log(`      • Field Types Used:`);
  Object.entries(typeCount).forEach(([type, count]) => {
    console.log(`        - ${type}: ${count}`);
  });

  // ════════════════════════════════════════════════════════════════════════
  // STAGE 3+4: Parallel Optimization (if enabled)
  // ════════════════════════════════════════════════════════════════════════
  let optimizedFields = rawFields;

  if (config.parallelOptimization && !shouldSkipOptimization && !shouldSkipEnhancement) {
    console.log('\n⚡ STAGE 3+4: PARALLEL OPTIMIZATION');
    console.log('   Running in PARALLEL mode for faster results');
    console.log(`   🤖 Stage 3 Model: ${GEMINI_MODELS.THREE_FLASH} (field optimizer)`);
    console.log(`   🤖 Stage 4 Model: ${GEMINI_MODELS.THREE_FLASH} (question enhancer)`);
    const parallelStart = Date.now();

    // Run field optimization and question enhancement in parallel
    const [optResult, enhResult] = await Promise.all([
      optimizeFieldTypes(rawFields, analysis.formType).catch(err => {
        console.warn('   ⚠️  Field optimization failed:', err.message || err);
        return rawFields;
      }),
      enhanceQuestions(rawFields, analysis, config).catch(err => {
        console.warn('   ⚠️  Question enhancement failed:', err.message || err);
        return rawFields;
      }),
    ]);
    const parallelTime = Date.now() - parallelStart;

    // Merge results: use optimized types from optResult, enhanced text from enhResult
    // Handle cases where either result might be raw fields (from catch blocks)
    optimizedFields = rawFields.map((field, idx) => {
      const opt = optResult[idx];
      const enh = enhResult[idx];
      
      // Check if opt/enh are actually enhanced results or just raw fields (fallback)
      const hasOptUpgrade = opt && opt.type !== field.type;
      const hasEnhancement = enh && enh.label !== field.label;
      
      // Merge quizConfig - prefer opt's quizConfig if it has correctAnswer set
      const mergedQuizConfig = opt?.quizConfig?.correctAnswer 
        ? opt.quizConfig 
        : (enh?.quizConfig || field.quizConfig);
      
      return {
        ...field,
        type: hasOptUpgrade ? opt.type : field.type,
        label: hasEnhancement ? enh.label : field.label,
        helpText: enh?.helpText || opt?.helpText || field.helpText,
        placeholder: enh?.placeholder || opt?.placeholder || field.placeholder,
        options: opt?.options || enh?.options || field.options,
        quizConfig: mergedQuizConfig,
      };
    });

    console.log(`   ⏱️  Parallel stages completed in ${parallelTime}ms`);
    
    // Count field type changes
    let typeChanges = 0;
    let labelChanges = 0;
    rawFields.forEach((original, idx) => {
      if (optimizedFields[idx].type !== original.type) typeChanges++;
      if (optimizedFields[idx].label !== original.label) labelChanges++;
    });
    console.log(`   📋 Results:`);
    console.log(`      • Field type upgrades: ${typeChanges}`);
    console.log(`      • Question enhancements: ${labelChanges}`);

    stagesCompleted.push('field-optimization', 'question-enhancement');
    modelsUsed.push(GEMINI_MODELS.THREE_FLASH);
  } else {
    // Run stages sequentially or skip
    if (!shouldSkipOptimization) {
      console.log('\n🔧 STAGE 3: FIELD TYPE OPTIMIZATION (Sequential)');
      console.log(`   🤖 Model: ${GEMINI_MODELS.THREE_FLASH} (field analyzer)`);
      const stage3Start = Date.now();
      optimizedFields = await optimizeFieldTypes(rawFields, analysis.formType);
      const stage3Time = Date.now() - stage3Start;
      console.log(`   ⏱️  Completed in ${stage3Time}ms`);
      stagesCompleted.push('field-optimization');
      modelsUsed.push(GEMINI_MODELS.THREE_FLASH);
    } else {
      console.log('\n⏭️  STAGE 3: SKIPPED (simple form or disabled)');
    }

    if (!shouldSkipEnhancement) {
      console.log('\n✨ STAGE 4: QUESTION ENHANCEMENT (Sequential)');
      console.log(`   🤖 Model: ${GEMINI_MODELS.THREE_FLASH} (creative enhancer)`);
      const stage4Start = Date.now();
      optimizedFields = await enhanceQuestions(optimizedFields, analysis, config);
      const stage4Time = Date.now() - stage4Start;
      console.log(`   ⏱️  Completed in ${stage4Time}ms`);
      stagesCompleted.push('question-enhancement');
      modelsUsed.push(GEMINI_MODELS.THREE_FLASH);
    } else {
      console.log('\n⏭️  STAGE 4: SKIPPED (simple form or disabled)');
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // FINAL: Assemble result
  // ════════════════════════════════════════════════════════════════════════
  const totalLatencyMs = Date.now() - startTime;
  
  // Log final summary
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                         ✅ PIPELINE COMPLETED                                ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  console.log(`📊 SUMMARY:`);
  console.log(`   • Total Time: ${totalLatencyMs}ms (${(totalLatencyMs / 1000).toFixed(2)}s)`);
  console.log(`   • Stages Completed: ${stagesCompleted.length}`);
  console.log(`   • Models Used: ${[...new Set(modelsUsed)].join(', ')}`);
  console.log(`   • Form Title: "${title}"`);
  console.log(`   • Total Fields: ${optimizedFields.length}`);
  
  // Final field type breakdown
  const finalTypeCount: Record<string, number> = {};
  optimizedFields.forEach(f => { finalTypeCount[f.type] = (finalTypeCount[f.type] || 0) + 1; });
  console.log(`   • Final Field Type Distribution:`);
  Object.entries(finalTypeCount).forEach(([type, count]) => {
    console.log(`     - ${type}: ${count}`);
  });
  console.log('─'.repeat(80));
  console.log('\n');

  return {
    title,
    fields: optimizedFields,
    quizMode,
    metadata: {
      formType: analysis.formType,
      domain: analysis.domain,
      tone: analysis.tone,
      complexity: analysis.complexity,
      pipeline: {
        stages: stagesCompleted,
        totalLatencyMs,
        modelsUsed: [...new Set(modelsUsed)],
      },
    },
  };
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick form generation (simplified pipeline for fast results)
 */
export async function generateFormQuick(prompt: string, questionCount?: number): Promise<GeneratedForm> {
  return runFormGenerationPipeline(
    { prompt, questionCount },
    {
      skipFieldOptimization: false, // Keep this - it's fast
      skipQuestionEnhancement: true, // Skip for speed
      parallelOptimization: true,
    }
  );
}

/**
 * High-quality form generation (full pipeline)
 */
export async function generateFormHighQuality(
  prompt: string,
  options?: {
    questionCount?: number;
    referenceData?: string;
    tone?: 'professional' | 'friendly' | 'casual' | 'formal';
  }
): Promise<GeneratedForm> {
  return runFormGenerationPipeline(
    {
      prompt,
      questionCount: options?.questionCount,
      referenceData: options?.referenceData,
    },
    {
      skipFieldOptimization: false,
      skipQuestionEnhancement: false,
      parallelOptimization: true,
      tone: options?.tone,
    }
  );
}

/**
 * Quiz generation (optimized for quizzes)
 */
export async function generateQuiz(
  topic: string,
  questionCount: number = 10,
  referenceData?: string
): Promise<GeneratedForm> {
  return runFormGenerationPipeline(
    {
      prompt: `Create a quiz about ${topic}`,
      questionCount,
      referenceData,
    },
    {
      skipFieldOptimization: false,
      skipQuestionEnhancement: false,
      parallelOptimization: true,
    }
  );
}

/**
 * Survey generation (optimized for surveys)
 */
export async function generateSurvey(
  topic: string,
  questionCount: number = 10
): Promise<GeneratedForm> {
  return runFormGenerationPipeline(
    {
      prompt: `Create a survey about ${topic}`,
      questionCount,
    },
    {
      skipFieldOptimization: false,
      skipQuestionEnhancement: false,
      parallelOptimization: true,
    }
  );
}
