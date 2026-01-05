import { NextResponse } from "next/server";
import { getAICompletion } from "@/lib/ai-provider";
import { contentAnalyzer, ContentAnalysis, SuggestedQuestion, FieldType } from "@/lib/content-analyzer";
import { generateFormDynamically } from "@/lib/dynamic-content-analyzer";
import { generateWithMultipleModels, MultiModelConfig } from "@/lib/multi-model-analyzer";
import { runFormGenerationPipeline } from "@/lib/form-generation-pipeline";

export const runtime = "nodejs";

// Feature flag to enable new multi-model pipeline
const USE_NEW_PIPELINE = true;

interface EnhancedGenerationRequest {
  content: string;
  referenceData?: string; // File/URL content to use as context only - keywords here should NOT affect form type
  sourceType?: 'text' | 'voice' | 'json' | 'document' | 'form_scan';
  userContext?: string; // Additional context from user
  useDynamicAnalysis?: boolean; // Use new dynamic AI-driven approach
  useMultiModel?: boolean; // Use multiple AI models for enhanced intelligence
  multiModelConfig?: {
    useEnsemble?: boolean; // Get multiple opinions
    validateOutput?: boolean; // Validate with second model
    enableRefinement?: boolean; // Refine based on validation
  };
  options?: {
    maxQuestions?: number;
    questionCount?: number; // Exact number of questions/fields to generate (max 120)
    includeOptionalFields?: boolean;
    targetAudience?: 'general' | 'professional' | 'academic' | 'medical';
    formComplexity?: 'simple' | 'moderate' | 'complex';
  };
}

interface Field {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
  };
  conditionalLogic?: Array<{
    id: string;
    sourceFieldId?: string;
    condition?: string;
    value?: string;
    action?: string;
    nested?: Array<{
      condition: string;
      value: string;
      action: string;
    }>;
  }>;
  order?: number;
}

/**
 * Enhanced Form Generation API
 * Uses dynamic AI-driven analysis for flexible, adaptive form generation
 */
export async function POST(req: Request) {
  try {
    const body = await req.json() as EnhancedGenerationRequest;
    const {
      content,
      referenceData, // File/URL content passed separately - should not affect form type detection
      sourceType = 'text',
      userContext,
      useDynamicAnalysis = true,
      useMultiModel = false, // Multi-model approach (opt-in for now)
      multiModelConfig,
      options
    } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: "Invalid content provided" },
        { status: 400 }
      );
    }

    // Use multi-model intelligence for maximum accuracy
    if (useMultiModel) {
      const config: MultiModelConfig = {
        complexity: options?.formComplexity,
        useEnsemble: multiModelConfig?.useEnsemble ?? true,
        validateOutput: multiModelConfig?.validateOutput ?? true,
        enableRefinement: multiModelConfig?.enableRefinement ?? true,
      };

      const { form, analysis } = await generateWithMultipleModels(
        content,
        userContext,
        config
      );

      return NextResponse.json({
        title: form.title,
        fields: form.fields.map((f: Field, idx: number) => ({
          id: f.id || `field_${Date.now()}_${idx}`,
          label: f.label,
          type: f.type,
          required: f.required !== false,
          placeholder: f.placeholder,
          helpText: f.helpText,
          options: f.options,
          validation: f.validation,
          order: f.order || idx,
          conditionalLogic: f.conditionalLogic || []
        })),
        analysis: {
          documentType: analysis.primaryAnalysis?.metadata?.contentType || 'general',
          domain: analysis.primaryAnalysis?.metadata?.domain || 'general',
          confidence: Math.max(...Object.values(analysis.modelConfidence)),
          summary: `Multi-model analysis (${Object.keys(analysis.modelConfidence).length} models used)`,
          understanding: analysis.primaryAnalysis?.understanding,
          suggestions: analysis.validationResult?.suggestions || [],
          multiModel: {
            modelsUsed: Object.keys(analysis.modelConfidence),
            consensus: analysis.consensus,
            validation: analysis.validationResult,
            selectedModel: analysis.selectedModel
          }
        }
      });
    }

    // ════════════════════════════════════════════════════════════════════════
    // NEW MULTI-MODEL PIPELINE (default when useDynamicAnalysis is true)
    // ════════════════════════════════════════════════════════════════════════
    if (useDynamicAnalysis && USE_NEW_PIPELINE) {
      console.log('\n');
      console.log('┌─────────────────────────────────────────────────────────────────────────────┐');
      console.log('│      🎯 GENERATE-ENHANCED API - MULTI-MODEL PIPELINE ACTIVATED              │');
      console.log('└─────────────────────────────────────────────────────────────────────────────┘');
      console.log(`📥 Request received:`);
      console.log(`   • Prompt: "${content}"`);
      console.log(`   • Reference data: ${referenceData ? 'YES (' + referenceData.length + ' chars)' : 'NO'}`);
      console.log(`   • User context: ${userContext ? 'YES' : 'NO'}`);

      const result = await runFormGenerationPipeline({
        prompt: content,
        questionCount: options?.questionCount,
        referenceData,
        userContext,
      }, {
        skipFieldOptimization: false,
        skipQuestionEnhancement: false,
        parallelOptimization: true,
        tone: options?.targetAudience === 'professional' ? 'professional' : 
              options?.targetAudience === 'academic' ? 'formal' : 'professional',
      });

      console.log('\n');
      console.log('┌─────────────────────────────────────────────────────────────────────────────┐');
      console.log('│                     📤 API RESPONSE READY                                   │');
      console.log('└─────────────────────────────────────────────────────────────────────────────┘');
      console.log(`   • Total time: ${result.metadata.pipeline.totalLatencyMs}ms`);
      console.log(`   • Models used: ${result.metadata.pipeline.modelsUsed.join(', ')}`);
      console.log(`   • Stages completed: ${result.metadata.pipeline.stages.join(' → ')}`);
      console.log(`   • Fields generated: ${result.fields.length}`);
      console.log('\n');

      // Check if quiz mode is enabled
      const isQuiz = result.quizMode?.enabled || result.fields.some(f => f.quizConfig);

      return NextResponse.json({
        title: result.title,
        ...(isQuiz ? { quizMode: result.quizMode } : {}),
        fields: result.fields.map((f, idx) => ({
          id: f.id || `field_${Date.now()}_${idx}`,
          label: f.label,
          type: f.type,
          required: f.required !== false,
          placeholder: f.placeholder,
          helpText: f.helpText,
          options: f.options,
          validation: f.validation,
          quizConfig: f.quizConfig ? {
            correctAnswer: f.quizConfig.correctAnswer || '',
            points: f.quizConfig.points || 1,
            explanation: f.quizConfig.explanation || ''
          } : undefined,
          order: f.order || idx,
          conditionalLogic: []
        })),
        analysis: {
          documentType: result.metadata.formType,
          domain: result.metadata.domain,
          confidence: 0.9, // High confidence from multi-model pipeline
          summary: `Generated ${result.metadata.formType} with ${result.fields.length} fields using multi-model pipeline`,
          understanding: {
            purpose: result.metadata.formType,
            context: result.metadata.domain,
            tone: result.metadata.tone,
          },
          suggestions: [],
          pipeline: result.metadata.pipeline, // Include pipeline metadata
        }
      });
    }

    // Use dynamic AI-driven analysis (legacy fallback)
    if (useDynamicAnalysis) {
      // Extract questionCount from options or content (max 120)
      const questionCount = options?.questionCount
        ? Math.min(Math.max(options.questionCount, 1), 120)
        : undefined;

      const { analysis, form } = await generateFormDynamically(content, userContext, {
        questionCount,
        referenceData // Pass file/URL content separately so it doesn't affect form type detection
      });

      // Get quizMode from the form (generated by dynamic analyzer) or detect it
      const formWithQuiz = form as { title: string; fields: any[]; quizMode?: any };
      const hasQuizConfig = formWithQuiz.fields?.some((f: any) => f.quizConfig);
      const quizModeFromForm = formWithQuiz.quizMode;

      // Use quizMode from form generation, or create default if quiz detected
      const isQuiz = quizModeFromForm?.enabled || hasQuizConfig;

      return NextResponse.json({
        title: formWithQuiz.title,
        // Include quizMode if this is a quiz - prefer the one from form generation
        ...(isQuiz ? {
          quizMode: quizModeFromForm || {
            enabled: true,
            showScoreImmediately: true,
            showCorrectAnswers: true,
            showExplanations: true,
            passingScore: 70
          }
        } : {}),
        fields: formWithQuiz.fields.map((f: any, idx: number) => ({
          id: f.id || `field_${Date.now()}_${idx}`,
          label: f.label,
          type: f.type,
          required: f.required !== false,
          placeholder: f.placeholder,
          helpText: f.helpText,
          options: f.options,
          validation: f.validation,
          // Ensure quizConfig has default points of 1
          quizConfig: f.quizConfig ? {
            correctAnswer: f.quizConfig.correctAnswer || '',
            points: f.quizConfig.points || 1,
            explanation: f.quizConfig.explanation || ''
          } : undefined,
          order: f.order || idx,
          conditionalLogic: f.conditionalLogic || []
        })),
        analysis: {
          documentType: analysis.metadata.contentType,
          domain: analysis.metadata.domain,
          confidence: analysis.metadata.confidence,
          summary: `${analysis.understanding.purpose}. Complexity: ${analysis.metadata.complexity}`,
          understanding: analysis.understanding,
          suggestions: analysis.metadata.suggestions
        }
      });
    }

    // Fallback to rule-based analysis (legacy)
    const analysis = await contentAnalyzer.analyze(content, options);
    const enhancedPrompt = buildEnhancedPrompt(content, analysis, sourceType);

    // Use multi-provider AI system (Cohere prioritized for structured JSON generation)
    const aiResponseObj = await getAICompletion({
      messages: [
        {
          role: "system",
          content: getEnhancedSystemPrompt(analysis, sourceType)
        },
        {
          role: "user",
          content: enhancedPrompt
        }
      ],
      temperature: 0.3,
      maxTokens: 3000,
      responseFormat: "json",
    });

    const aiResponse = aiResponseObj.content || "{}";
    console.log(`Enhanced form generated using ${aiResponseObj.provider} AI provider`);
    const generatedForm = JSON.parse(aiResponse) as { title: string; fields: Field[] };
    const enhancedFields = mergeFieldSuggestions(
      generatedForm.fields,
      analysis.suggestedQuestions,
      analysis
    );
    const fieldsWithLogic = applyRelationshipLogic(enhancedFields, analysis);

    return NextResponse.json({
      title: generatedForm.title || generateSmartTitle(analysis),
      fields: fieldsWithLogic,
      analysis: {
        documentType: analysis.documentType,
        domain: analysis.domain,
        confidence: analysis.confidence,
        summary: analysis.summary
      }
    });
  } catch (error) {
    console.error("Enhanced form generation error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate form";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

function getEnhancedSystemPrompt(analysis: ContentAnalysis, sourceType: string): string {
  const docType = analysis.documentType?.toLowerCase() || '';

  // Expanded type detection
  const isQuizLike = docType.includes('quiz') ||
    docType.includes('test') ||
    docType.includes('exam') ||
    docType.includes('assessment') ||
    docType.includes('trivia');
  const isSurveyLike = docType.includes('survey') ||
    docType.includes('questionnaire') ||
    docType.includes('feedback') ||
    docType.includes('poll');
  const isRSVP = docType.includes('rsvp') ||
    docType.includes('invitation') ||
    docType.includes('event') ||
    docType.includes('attendance');
  const isRegistration = docType.includes('registration') ||
    docType.includes('signup') ||
    docType.includes('enrollment');
  const isBooking = docType.includes('booking') ||
    docType.includes('appointment') ||
    docType.includes('reservation');
  const isApplication = docType.includes('application') ||
    docType.includes('job') ||
    docType.includes('candidate');
  const isDonation = docType.includes('donation') ||
    docType.includes('fundrais') ||
    docType.includes('charity');
  const isPetition = docType.includes('petition') ||
    docType.includes('signature');
  const isConsent = docType.includes('consent') ||
    docType.includes('agreement') ||
    docType.includes('waiver');

  return `You are a world-class form architect combining expertise in UX design, psychometrics, survey methodology, and domain-specific best practices. Your mission is to create forms that capture MAXIMUM STRATEGIC VALUE.

CONTEXT:
- Document Type: ${analysis.documentType}
- Domain: ${analysis.domain}
- Language: ${analysis.language}
- Source Type: ${sourceType}
- Is Assessment/Quiz: ${isQuizLike ? 'YES' : 'NO'}
- Is Survey/Research: ${isSurveyLike ? 'YES' : 'NO'}
- Is RSVP/Event: ${isRSVP ? 'YES' : 'NO'}
- Is Registration: ${isRegistration ? 'YES' : 'NO'}
- Is Booking: ${isBooking ? 'YES' : 'NO'}
- Is Application: ${isApplication ? 'YES' : 'NO'}
- Is Donation: ${isDonation ? 'YES' : 'NO'}
- Is Petition: ${isPetition ? 'YES' : 'NO'}
- Is Consent: ${isConsent ? 'YES' : 'NO'}

═══════════════════════════════════════════════════════════════
                    INTELLIGENCE REQUIREMENTS
═══════════════════════════════════════════════════════════════

Your generated form must:
1. **MAXIMIZE INSIGHT** - Every field serves a strategic purpose
2. **ENABLE ANALYSIS** - Design for segmentation and correlation discovery
3. **PREDICT BEHAVIOR** - Include fields that indicate future actions
4. **REDUCE FRICTION** - Smart defaults, clear guidance, logical flow
5. **DOMAIN MASTERY** - Apply industry-specific best practices

${isRSVP ? `
═══════════════════════════════════════════════════════════════
              RSVP/EVENT RESPONSE FORM ACTIVE
═══════════════════════════════════════════════════════════════

CRITICAL REQUIREMENTS:
1. Include attendance confirmation (Yes/No/Maybe) as radio buttons
2. Capture guest name and contact information
3. Ask about number of guests/plus ones if applicable
4. Include meal preferences and dietary restrictions
5. Allow for special accommodation requests
6. Optional message to host field
7. Keep it simple and celebratory in tone
` : ''}

${isRegistration ? `
═══════════════════════════════════════════════════════════════
              REGISTRATION/SIGNUP FORM ACTIVE
═══════════════════════════════════════════════════════════════

CRITICAL REQUIREMENTS:
1. Capture essential identity information (name, email)
2. Include appropriate contact fields
3. Add consent checkboxes for terms/privacy
4. Consider optional profile enhancement fields
5. Design for conversion - minimize required fields
` : ''}

${isBooking ? `
═══════════════════════════════════════════════════════════════
              BOOKING/APPOINTMENT FORM ACTIVE
═══════════════════════════════════════════════════════════════

CRITICAL REQUIREMENTS:
1. Capture contact information
2. Include date and time selection fields
3. Ask about service/appointment type
4. Allow for special requests
5. Include confirmation preferences
` : ''}

${isDonation ? `
═══════════════════════════════════════════════════════════════
              DONATION/FUNDRAISING FORM ACTIVE
═══════════════════════════════════════════════════════════════

CRITICAL REQUIREMENTS:
1. Capture donor information
2. Include donation amount options (preset + custom)
3. Ask about one-time vs recurring
4. Allow for dedication/tribute options
5. Include anonymous donation option
` : ''}

${isPetition ? `
═══════════════════════════════════════════════════════════════
              PETITION/SIGNATURE FORM ACTIVE
═══════════════════════════════════════════════════════════════

CRITICAL REQUIREMENTS:
1. Capture signatory name
2. Include email for verification
3. Ask for location/region
4. Allow optional comment/reason
5. Include public display consent option
` : ''}

${isConsent ? `
═══════════════════════════════════════════════════════════════
              CONSENT/AGREEMENT FORM ACTIVE
═══════════════════════════════════════════════════════════════

CRITICAL REQUIREMENTS:
1. Capture signatory identification
2. Use separate checkboxes for each consent item
3. Include date field
4. Add acknowledgment of understanding
5. Keep language clear and unambiguous
` : ''}

${isQuizLike ? `
═══════════════════════════════════════════════════════════════
              QUIZ/ASSESSMENT GENERATION ACTIVE
═══════════════════════════════════════════════════════════════

CRITICAL REQUIREMENTS:
1. Generate REAL KNOWLEDGE QUESTIONS - test actual subject matter expertise
2. Include questions at multiple difficulty levels (easy/medium/hard)
3. Use plausible distractors based on common misconceptions
4. NEVER ask opinion or reflection questions
5. ALWAYS include quizConfig with correctAnswer, points, explanation

QUESTION COGNITIVE LEVELS:
- 20% Recall: Direct facts
- 30% Understanding: Explain concepts
- 30% Application: Use in scenarios
- 20% Analysis: Compare, evaluate

FORBIDDEN QUESTION TYPES:
❌ "How do you feel about..."
❌ "What interests you about..."
❌ "Rate your knowledge of..."
❌ "What challenges do you face with..."
` : ''}

${isSurveyLike ? `
═══════════════════════════════════════════════════════════════
              SURVEY/RESEARCH INSTRUMENT ACTIVE
═══════════════════════════════════════════════════════════════

MEASUREMENT STANDARDS:
1. Use validated scales (Likert 5-7 point, NPS 0-10, semantic differential)
2. Avoid double-barreled questions
3. Use neutral, non-leading wording
4. Include anchors and scale labels
5. Design for statistical analysis
6. FIELD TYPES: Use 'radio' for single choice, 'checkboxes' for multiple choice

HIGH-VALUE QUESTION TYPES:
- NPS: "How likely to recommend?" (0-10) (Type: radio)
- Satisfaction: 5-point (Very Dissatisfied → Very Satisfied) (Type: radio)
- Agreement: 5-point (Strongly Disagree → Strongly Agree) (Type: radio)
- Frequency: (Never → Always) (Type: radio)
- Importance: (Not at all → Extremely) (Type: radio)
- Open-ended: "What ONE thing would you change?" (Type: textarea)
- Multiple Choice: "Select all that apply" (Type: checkboxes)

AVOID THESE MISTAKES:
❌ Using 'checkbox' for list selection (Use 'checkboxes')
❌ Returning empty 'options' arrays

` : ''}

INTELLIGENT FIELD GENERATION:

1. FIELD TYPE MASTERY:
- Email → type: "email" with format validation
- Phone → type: "tel" with international support
- Dates → type: "date" with context-appropriate ranges
- Long responses → type: "textarea" with character guidance
- Ratings → type: "star-rating" or "opinion-scale"
- Single choice (2-5 options) → type: "radio"
- Single choice (5+ options) → type: "select"
- Multiple choice → type: "checkbox" or "multiselect"
- Rankings → type: "ranking"

2. DOMAIN EXCELLENCE:
${getDomainSpecificRules(analysis.domain)}

3. STRATEGIC ADDITIONS:
- Add segmentation fields (industry, company size, role)
- Include intent indicators (goals, timeline, urgency)
- Gather source attribution (how did you find us?)
- Enable personalization (preferences, interests)

4. SMART VALIDATION:
- Phone: International format patterns
- Email: Standard email validation
- Numbers: Contextual min/max limits
- Text: Character limits based on expected input

JSON STRUCTURE:
{
  "title": "Strategic, descriptive title reflecting form purpose",
  "quizMode": { // Only for assessments
    "enabled": true,
    "showScoreImmediately": true,
    "showCorrectAnswers": true,
    "showExplanations": true,
    "passingScore": 70
  },
  "fields": [
    {
      "id": "semantic_snake_case_id",
      "label": "Clear, unambiguous question",
      "type": "optimal_field_type",
      "required": true|false,
      "placeholder": "Example showing expected format",
      "helpText": "Strategic guidance explaining field value",
      "options": ["Mutually exclusive", "Exhaustive options"],
      "validation": { /* appropriate rules */ },
      "quizConfig": { // Only for quiz questions
        "correctAnswer": "Exact answer or array",
        "points": 1-3,
        "explanation": "Why correct and why others wrong"
      },
      "order": sequential_number
    }
  ]
}`;
}

function buildEnhancedPrompt(
  content: string,
  analysis: ContentAnalysis,
  sourceType: string
): string {
  const entitySummary = analysis.extractedEntities
    .map(e => `- ${e.type}: ${e.value}`)
    .join('\n');

  const suggestedQuestionsSummary = analysis.suggestedQuestions
    .slice(0, 5)
    .map(q => `- ${q.question} (${q.fieldType})`)
    .join('\n');

  return `Analyze this ${sourceType} content and generate an intelligent form:

CONTENT:
"${content}"

ANALYSIS RESULTS:
Document Type: ${analysis.documentType}
Domain: ${analysis.domain}
Confidence: ${(analysis.confidence * 100).toFixed(1)}%

EXTRACTED ENTITIES:
${entitySummary || 'No specific entities found'}

SUGGESTED QUESTIONS (Top 5):
${suggestedQuestionsSummary}

REQUIREMENTS:
1. Generate a form that captures all relevant information from this content
2. Use the document type (${analysis.documentType}) to guide form structure
3. Apply ${analysis.domain} domain best practices
4. Don't ask for information already present in the content
5. Create logical question flow with appropriate grouping
6. Use smart field types based on the data being collected
7. Add helpful placeholders and validation where appropriate

Generate a JSON response with a clear title and well-structured fields.`;
}

function getDomainSpecificRules(domain: string): string {
  const rules: Record<string, string> = {
    healthcare: `
- Include patient identification fields (name, DOB, ID)
- Add medical history sections with appropriate privacy considerations
- Use specific medical terminology in labels
- Include consent and HIPAA acknowledgment fields
- Add emergency contact information`,
    education: `
- Include student/applicant identification
- Add academic background sections
- Use education-specific terminology
- Include transcript/document upload options
- Add program/course selection fields`,
    business: `
- Include company/organization fields
- Add professional information sections
- Use business terminology
- Include budget/financial fields with number validation
- Add project/department selection`,
    government: `
- Include official identification fields
- Add residency/citizenship status
- Use formal language in labels
- Include document/permit numbers
- Add legal acknowledgments`,
    finance: `
- Include account/identification numbers
- Add financial information with security in mind
- Use precise financial terminology
- Include amount fields with currency formatting
- Add security questions`,
    legal: `
- Include party identification
- Add case/matter references
- Use precise legal terminology
- Include signature and witness fields
- Add jurisdiction selections`,
    retail: `
- Include customer information
- Add product/order details
- Use shopping-friendly terminology
- Include quantity and pricing fields
- Add shipping/billing addresses`,
    general: `
- Use clear, universal language
- Include standard contact fields
- Add common identification elements
- Keep terminology simple
- Focus on essential information`
  };

  return rules[domain] || rules.general;
}

function mergeFieldSuggestions(
  aiFields: Field[],
  suggestedQuestions: SuggestedQuestion[],
  analysis: ContentAnalysis
): Field[] {
  const mergedFields: Field[] = [];
  const processedQuestions = new Set<string>();

  // First, process AI-generated fields
  aiFields.forEach(field => {
    const enhancedField = { ...field };

    // Find matching suggested question
    const matchingQuestion = suggestedQuestions.find(q =>
      normalizeQuestion(q.question) === normalizeQuestion(field.label) ||
      q.fieldType === mapFieldType(field.type)
    );

    if (matchingQuestion) {
      // Enhance with suggestion details
      enhancedField.helpText = enhancedField.helpText || matchingQuestion.helpText;
      enhancedField.placeholder = enhancedField.placeholder || matchingQuestion.placeholder;
      if (matchingQuestion.validation && typeof matchingQuestion.validation === 'object') {
        // Only merge compatible validation properties
        const validation = matchingQuestion.validation as { pattern?: string; min?: number; max?: number; minLength?: number; maxLength?: number };
        enhancedField.validation = { ...enhancedField.validation, ...validation };
      }
      processedQuestions.add(matchingQuestion.question);
    }

    mergedFields.push(enhancedField);
  });

  // Add suggested questions not covered by AI
  suggestedQuestions
    .filter(q => !processedQuestions.has(q.question))
    .forEach((question, index) => {
      // Convert validation if present
      const validation = question.validation && typeof question.validation === 'object'
        ? question.validation as { pattern?: string; min?: number; max?: number; minLength?: number; maxLength?: number }
        : undefined;

      mergedFields.push({
        id: `field_${Date.now()}_${index}`,
        label: question.question,
        type: question.fieldType,
        required: question.required,
        placeholder: question.placeholder,
        helpText: question.helpText,
        options: question.options,
        validation,
        order: mergedFields.length + index
      });
    });

  // Sort by logical order
  return mergedFields.sort((a, b) => (a.order || 0) - (b.order || 0));
}

function applyRelationshipLogic(
  fields: Field[],
  analysis: ContentAnalysis
): Field[] {
  return fields.map((field, index) => {
    const relationships = analysis.relationships.filter(
      rel => rel.to === String(index)
    );

    if (relationships.length > 0) {
      field.conditionalLogic = relationships.map(rel => ({
        id: `condition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sourceFieldId: fields[parseInt(rel.from)]?.id,
        condition: rel.type === 'depends_on' ? 'equals' : 'not_empty',
        value: rel.type === 'depends_on' ? 'yes' : undefined,
        action: 'show'
      }));
    }

    return field;
  });
}

// Update interface to include nested
interface Field {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
  };
  conditionalLogic?: Array<{
    id: string;
    sourceFieldId?: string;
    condition?: string;
    value?: string;
    action?: string;
    nested?: Array<{
      condition: string;
      value: string;
      action: string;
    }>;
  }>;
  order?: number;
}

// Remove metadata check to avoid type error
function generateAdvancedConditionalLogic(
  fields: Field[],
  analysis: ContentAnalysis
): Field[] {
  // Enhanced logic: Add nested conditions and multiple actions
  return fields.map((field, index) => {
    const enhancedField = { ...field };
    const related = analysis.relationships.filter(rel => rel.to === String(index));

    if (related.length > 0) {
      enhancedField.conditionalLogic = related.map(rel => {
        const baseCondition: {
          id: string;
          sourceFieldId?: string;
          condition: string;
          value?: string;
          action: string;
          nested?: Array<{
            condition: string;
            value: string;
            action: string;
          }>;
        } = {
          id: `adv_condition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          sourceFieldId: fields[parseInt(rel.from)]?.id,
          condition: getAdvancedCondition(rel.type),
          value: getConditionValue(rel.type),
          action: getPrimaryAction(rel.type)
        };

        // TODO: Add nested conditions based on analysis complexity when integrating DynamicAnalysis
        // For now, add a default nested example for demonstration
        baseCondition.nested = [{
          condition: 'greater_than',
          value: '18',
          action: 'require'
        }];

        return baseCondition;
      });
    }

    return enhancedField;
  });
}

function getAdvancedCondition(type: string): string {
  const conditions: Record<string, string> = {
    depends_on: 'equals',
    requires: 'not_empty',
    validates: 'matches_pattern',
    thresholds: 'greater_than'
  };
  return conditions[type] || 'equals';
}

function getConditionValue(type: string): string | undefined {
  const values: Record<string, string> = {
    depends_on: 'yes',
    thresholds: '0'
  };
  return values[type];
}

function getPrimaryAction(type: string): string {
  const actions: Record<string, string> = {
    depends_on: 'show',
    requires: 'require',
    validates: 'validate'
  };
  return actions[type] || 'show';
}

function generateSmartTitle(analysis: ContentAnalysis): string {
  const typeNames: Record<string, string> = {
    registration_form: 'Registration Form',
    survey: 'Survey',
    medical_form: 'Medical Information Form',
    application: 'Application Form',
    feedback_form: 'Feedback Form',
    contact_form: 'Contact Form',
    booking_form: 'Booking Form',
    questionnaire: 'Questionnaire',
    assessment: 'Assessment Form',
    order_form: 'Order Form',
    consent_form: 'Consent Form',
    general: 'Form'
  };

  const domainAdjectives: Record<string, string> = {
    healthcare: 'Medical',
    education: 'Academic',
    business: 'Business',
    government: 'Official',
    finance: 'Financial',
    legal: 'Legal',
    retail: 'Customer',
    general: ''
  };

  const domainAdj = domainAdjectives[analysis.domain] || '';
  const typeName = typeNames[analysis.documentType] || 'Form';

  return `${domainAdj} ${typeName}`.trim();
}

function normalizeQuestion(question: string): string {
  return question.toLowerCase().replace(/[^\w\s]/g, '').trim();
}

function mapFieldType(fieldType: string): FieldType {
  const typeMap: Record<string, FieldType> = {
    'text': 'text',
    'email': 'email',
    'tel': 'tel',
    'phone': 'tel',
    'number': 'number',
    'date': 'date',
    'time': 'time',
    'datetime': 'datetime',
    'textarea': 'textarea',
    'select': 'select',
    'dropdown': 'select',
    'radio': 'radio',
    'checkbox': 'checkbox',
    'file': 'file',
    'upload': 'file',
    'range': 'range',
    'slider': 'range',
    'color': 'color',
    'url': 'url',
    'password': 'password'
  };

  return (typeMap[fieldType.toLowerCase()] || 'text') as FieldType;
}
