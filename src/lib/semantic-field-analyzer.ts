/**
 * Semantic Field Analyzer
 * 
 * Uses fast AI model to intelligently map questions to optimal field types
 * from the full field palette (30+ types)
 */

import { getAICompletion, GEMINI_MODELS } from './ai-provider';

// ============================================================================
// FIELD TYPE DEFINITIONS (Full Palette)
// ============================================================================

export const FULL_FIELD_PALETTE = {
  // Text Input
  'short-answer': {
    category: 'Text',
    description: 'Single-line text input for brief responses',
    semanticSignals: ['name', 'title', 'subject', 'brief', 'short', 'one word', 'what is your', 'enter your'],
    maxResponseLength: 'short (< 100 chars)',
    useWhen: 'Collecting names, titles, brief answers, single-line text',
  },
  'long-answer': {
    category: 'Text',
    description: 'Multi-line text area for detailed responses',
    semanticSignals: ['describe', 'explain', 'tell us', 'detail', 'elaborate', 'comments', 'feedback', 'message', 'story', 'why', 'how'],
    maxResponseLength: 'unlimited',
    useWhen: 'Collecting explanations, descriptions, feedback, detailed responses',
  },

  // Choices - Single Selection
  'multiple-choice': {
    category: 'Choices',
    description: 'Radio buttons for single selection from 2-6 options',
    semanticSignals: ['choose one', 'select one', 'which', 'pick one', 'prefer'],
    optionCount: '2-6 options',
    useWhen: 'Single selection from few options, quiz questions, clear choices',
  },
  'dropdown': {
    category: 'Choices',
    description: 'Compact dropdown menu for single selection from many options',
    semanticSignals: ['select from', 'choose from list', 'country', 'state', 'category'],
    optionCount: '6+ options',
    useWhen: 'Long option lists (countries, categories), compact UI needed',
  },
  'switch': {
    category: 'Choices',
    description: 'Toggle for yes/no or on/off binary choices',
    semanticSignals: ['yes or no', 'will you', 'are you', 'do you', 'agree', 'accept', 'confirm', 'attending', 'subscribe'],
    optionCount: 'exactly 2 (binary)',
    useWhen: 'Yes/No questions, agreements, attendance, binary toggles',
  },

  // Choices - Multiple Selection
  'checkboxes': {
    category: 'Choices',
    description: 'Multiple selection checkboxes',
    semanticSignals: ['select all', 'check all', 'multiple', 'all that apply', 'interests', 'preferences'],
    optionCount: 'any',
    allowsMultiple: true,
    useWhen: 'Multiple selections allowed, "select all that apply" questions',
  },
  'multiselect': {
    category: 'Choices',
    description: 'Compact multi-select dropdown',
    semanticSignals: ['select multiple', 'choose several', 'tags', 'categories'],
    optionCount: '6+ options with multiple selection',
    allowsMultiple: true,
    useWhen: 'Multiple selections from long lists',
  },

  // Choices - Special
  'picture-choice': {
    category: 'Choices',
    description: 'Visual selection with images',
    semanticSignals: ['choose design', 'select style', 'which looks', 'pick image', 'visual preference'],
    requiresImages: true,
    useWhen: 'Visual preferences, product selection, style choices',
  },
  'choice-matrix': {
    category: 'Choices',
    description: 'Grid for rating multiple items on same scale',
    semanticSignals: ['rate each', 'for each', 'matrix', 'grid', 'multiple items same scale'],
    useWhen: 'Rating multiple items, comparing options, survey grids',
  },

  // Rating & Ranking
  'star-rating': {
    category: 'Rating',
    description: '1-5 star visual rating',
    semanticSignals: ['rate', 'rating', 'stars', 'how satisfied', 'quality', 'experience', 'out of 5'],
    scale: '1-5 stars',
    useWhen: 'Satisfaction ratings, quality ratings, experience ratings',
  },
  'opinion-scale': {
    category: 'Rating',
    description: 'Numeric scale with labeled endpoints (Likert, NPS)',
    semanticSignals: ['agree/disagree', 'likely/unlikely', 'scale of', 'recommend', 'nps', '0-10', '1-7', 'strongly'],
    scale: 'customizable (1-5, 1-7, 0-10)',
    useWhen: 'Likert scales, NPS scores, agreement scales, likelihood',
  },
  'slider': {
    category: 'Rating',
    description: 'Continuous range slider',
    semanticSignals: ['range', 'between', 'from X to Y', 'percentage', 'how much', 'budget range'],
    scale: 'continuous',
    useWhen: 'Budget ranges, percentages, continuous numeric values',
  },
  'ranking': {
    category: 'Rating',
    description: 'Drag-and-drop ordering of items',
    semanticSignals: ['rank', 'order', 'prioritize', 'preference order', 'most to least', 'arrange'],
    useWhen: 'Prioritization, preference ordering, ranking items',
  },

  // Contact Information
  'email': {
    category: 'Contact',
    description: 'Email input with validation',
    semanticSignals: ['email', 'e-mail', 'contact email', 'email address'],
    validation: 'email format',
    useWhen: 'Collecting email addresses',
  },
  'phone': {
    category: 'Contact',
    description: 'Phone number with formatting',
    semanticSignals: ['phone', 'telephone', 'mobile', 'cell', 'contact number', 'call'],
    validation: 'phone format',
    useWhen: 'Collecting phone numbers',
  },
  'address': {
    category: 'Contact',
    description: 'Full address with autocomplete',
    semanticSignals: ['address', 'location', 'where do you live', 'street', 'mailing address', 'shipping'],
    useWhen: 'Collecting mailing/shipping addresses',
  },

  // Date & Time
  'date-picker': {
    category: 'Date & Time',
    description: 'Calendar date selector',
    semanticSignals: ['date', 'when', 'birthday', 'birth date', 'deadline', 'appointment date', 'what day'],
    useWhen: 'Selecting a specific date',
  },
  'time-picker': {
    category: 'Date & Time',
    description: 'Time selector',
    semanticSignals: ['time', 'what time', 'hour', 'when (time)', 'preferred time'],
    useWhen: 'Selecting a specific time',
  },
  'datetime-picker': {
    category: 'Date & Time',
    description: 'Combined date and time selector',
    semanticSignals: ['date and time', 'when exactly', 'schedule', 'appointment', 'specific moment'],
    useWhen: 'Selecting both date and time together',
  },
  'date-range': {
    category: 'Date & Time',
    description: 'Start and end date selector',
    semanticSignals: ['from...to', 'between dates', 'availability', 'duration', 'start and end', 'period'],
    useWhen: 'Date ranges, availability periods, project durations',
  },

  // Numbers
  'number': {
    category: 'Number',
    description: 'Numeric input',
    semanticSignals: ['how many', 'quantity', 'age', 'number of', 'count', 'years', 'amount'],
    useWhen: 'Collecting numeric values (age, quantity, count)',
  },
  'currency': {
    category: 'Number',
    description: 'Monetary amount with currency formatting',
    semanticSignals: ['price', 'cost', 'budget', 'salary', 'amount', 'donate', 'pay', '$', '€', '£', 'money'],
    useWhen: 'Collecting monetary amounts',
  },

  // Files
  'file-uploader': {
    category: 'Files',
    description: 'File upload interface',
    semanticSignals: ['upload', 'attach', 'resume', 'cv', 'document', 'photo', 'file', 'portfolio', 'image'],
    useWhen: 'File uploads (documents, images, resumes)',
  },

  // Display (non-input)
  'heading': {
    category: 'Display',
    description: 'Section header',
    isInput: false,
    useWhen: 'Adding section titles',
  },
  'paragraph': {
    category: 'Display',
    description: 'Explanatory text block',
    isInput: false,
    useWhen: 'Adding instructions or descriptions',
  },
  'divider': {
    category: 'Display',
    description: 'Visual separator line',
    isInput: false,
    useWhen: 'Separating form sections',
  },
} as const;

export type FieldTypeKey = keyof typeof FULL_FIELD_PALETTE;

// ============================================================================
// SEMANTIC FIELD ANALYSIS
// ============================================================================

export interface FieldAnalysisInput {
  label: string;
  currentType?: string;
  options?: string[];
  helpText?: string;
  context?: string; // Form context (survey, quiz, registration, etc.)
}

export interface FieldAnalysisResult {
  recommendedType: FieldTypeKey;
  confidence: number;
  reasoning: string;
  alternativeTypes?: FieldTypeKey[];
  suggestedOptions?: string[];
  suggestedCorrectAnswer?: string; // For quiz questions - which option is correct
  suggestedPlaceholder?: string;
  suggestedHelpText?: string;
  suggestedValidation?: Record<string, unknown>;
}

// ============================================================================
// DYNAMIC AI-POWERED QUIZ OPTION GENERATION
// ============================================================================

interface QuizOptionsResult {
  options: string[];
  correctAnswer: string;
}

/**
 * Dynamically generate quiz options using AI based on the question context
 * This works for ANY topic - physics, chemistry, history, literature, etc.
 */
export async function generateQuizOptionsWithAI(questionLabel: string, helpText?: string): Promise<QuizOptionsResult> {
  console.log(`         🧠 [Quiz Option Generator] Generating options for: "${questionLabel.substring(0, 40)}..."`);
  
  const systemPrompt = `You are an expert quiz creator. Given a quiz question, generate 4 multiple choice options where exactly ONE is correct.

CRITICAL RULES:
1. Generate exactly 4 options
2. One option MUST be the correct answer
3. The other 3 must be plausible but WRONG (good distractors)
4. Options should be concise and clear
5. For math/science questions, show actual calculated values
6. For factual questions, use realistic alternatives
7. Make distractors believable - common misconceptions work well

Return ONLY valid JSON in this exact format:
{
  "options": ["option1", "option2", "option3", "option4"],
  "correctAnswer": "the correct option text exactly as it appears in options array"
}`;

  const userPrompt = `Generate 4 multiple choice options for this quiz question:

QUESTION: ${questionLabel}
${helpText ? `CONTEXT/HINT: ${helpText}` : ''}

Remember:
- One option must be correct
- Three options must be plausible but wrong
- Return valid JSON only`;

  try {
    const result = await getAICompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      maxTokens: 500,
      responseFormat: 'json',
      model: GEMINI_MODELS.FLASH_LITE // Use Flash-Lite for simple option generation
    });

    const parsed = JSON.parse(result.content);
    
    // Validate the response
    if (parsed.options && Array.isArray(parsed.options) && parsed.options.length >= 4 && parsed.correctAnswer) {
      // Ensure correctAnswer is in options
      if (!parsed.options.includes(parsed.correctAnswer)) {
        parsed.options[0] = parsed.correctAnswer;
      }
      console.log(`         ✅ [Quiz Option Generator] Generated ${parsed.options.length} options, correct: "${parsed.correctAnswer.substring(0, 20)}..."`);
      return {
        options: parsed.options.slice(0, 4),
        correctAnswer: parsed.correctAnswer,
      };
    }
    
    throw new Error('Invalid AI response format');
  } catch (error) {
    console.error(`         ⚠️ [Quiz Option Generator] AI generation failed:`, error instanceof Error ? error.message : error);
    // Ultimate fallback - generic options that clearly indicate they need editing
    return {
      options: ['[Option 1 - needs editing]', '[Option 2 - needs editing]', '[Option 3 - needs editing]', '[Option 4 - needs editing]'],
      correctAnswer: '[Option 1 - needs editing]',
    };
  }
}

/**
 * Batch generate quiz options for multiple questions efficiently
 */
async function batchGenerateQuizOptions(questions: { label: string; helpText?: string }[]): Promise<QuizOptionsResult[]> {
  console.log(`         🧠 [Quiz Option Generator] Batch generating options for ${questions.length} questions...`);
  
  const systemPrompt = `You are an expert quiz creator. Given multiple quiz questions, generate 4 multiple choice options for EACH question where exactly ONE is correct per question.

CRITICAL RULES:
1. Generate exactly 4 options per question
2. One option per question MUST be the correct answer
3. The other 3 must be plausible but WRONG (good distractors)
4. For math/science, calculate actual values
5. For factual questions, use realistic alternatives
6. Make distractors believable

Return ONLY valid JSON array:
[
  { "options": ["opt1", "opt2", "opt3", "opt4"], "correctAnswer": "correct option text" },
  ...
]`;

  const questionsText = questions.map((q, i) => 
    `${i + 1}. ${q.label}${q.helpText ? ` (Hint: ${q.helpText})` : ''}`
  ).join('\n');

  const userPrompt = `Generate 4 multiple choice options for EACH of these ${questions.length} quiz questions:

${questionsText}

Return a JSON array with one object per question, in the same order.`;

  try {
    const result = await getAICompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      maxTokens: 2000,
      responseFormat: 'json',
      model: GEMINI_MODELS.FLASH_LITE // Use Flash-Lite for batch option generation
    });

    const parsed = JSON.parse(result.content);
    const results = Array.isArray(parsed) ? parsed : (parsed.results || parsed.questions || []);
    
    console.log(`         ✅ [Quiz Option Generator] Batch generated options for ${results.length} questions`);
    
    return results.map((r: Record<string, unknown>) => {
      const options = (r.options as string[]) || [];
      const correctAnswer = (r.correctAnswer as string) || options[0] || '[Needs editing]';
      
      if (options.length >= 4 && correctAnswer) {
        return { options: options.slice(0, 4), correctAnswer };
      }
      return {
        options: ['[Option 1 - needs editing]', '[Option 2 - needs editing]', '[Option 3 - needs editing]', '[Option 4 - needs editing]'],
        correctAnswer: '[Option 1 - needs editing]',
      };
    });
  } catch (error) {
    console.error(`         ⚠️ [Quiz Option Generator] Batch generation failed:`, error instanceof Error ? error.message : error);
    // Return fallback for all questions
    return questions.map(() => ({
      options: ['[Option 1 - needs editing]', '[Option 2 - needs editing]', '[Option 3 - needs editing]', '[Option 4 - needs editing]'],
      correctAnswer: '[Option 1 - needs editing]',
    }));
  }
}

/**
 * Build the field type reference for AI prompts
 */
function buildFieldTypeReference(): string {
  const categories = new Map<string, string[]>();

  for (const [type, config] of Object.entries(FULL_FIELD_PALETTE)) {
    const cat = config.category;
    if (!categories.has(cat)) categories.set(cat, []);
    
    const signals = 'semanticSignals' in config ? config.semanticSignals.join(', ') : '';
    const useWhen = config.useWhen || '';
    
    categories.get(cat)!.push(
      `  - "${type}": ${config.description}${signals ? ` | Signals: ${signals}` : ''}${useWhen ? ` | Use when: ${useWhen}` : ''}`
    );
  }

  let reference = '';
  for (const [category, types] of categories) {
    reference += `\n### ${category}\n${types.join('\n')}\n`;
  }
  return reference;
}

/**
 * Analyze a batch of fields and recommend optimal types
 */
export async function analyzeFieldTypes(
  fields: FieldAnalysisInput[],
  formContext?: string
): Promise<FieldAnalysisResult[]> {
  console.log('         🔍 [Semantic Analyzer] Starting batch analysis...');
  console.log(`         📊 Fields to analyze: ${fields.length}`);
  console.log(`         📋 Form context: ${formContext || 'General'}`);
  
  // For quizzes, FORCE conversion of text fields to multiple-choice
  const isQuiz = formContext?.toLowerCase().includes('quiz') || formContext?.toLowerCase().includes('test');
  if (isQuiz) {
    console.log('         🎯 [Semantic Analyzer] QUIZ DETECTED - Will convert all text fields to multiple-choice');
  }
  
  const fieldTypeRef = buildFieldTypeReference();

  const systemPrompt = `You are an expert form UX designer and semantic analyzer. Your task is to analyze form fields and recommend the OPTIMAL field type from the available palette.

AVAILABLE FIELD TYPES:
${fieldTypeRef}

CRITICAL RULES:
1. ALWAYS prefer specialized types over generic ones:
   - Email questions → "email" (NOT "short-answer")
   - Phone questions → "phone" (NOT "short-answer")
   - Yes/No questions → "switch" (NOT "multiple-choice" with Yes/No options)
   - Rating 1-5 → "star-rating" (NOT "number")
   - Agree/Disagree → "opinion-scale" (NOT "multiple-choice")
   - Long option lists (6+) → "dropdown" (NOT "multiple-choice")
   - File uploads → "file-uploader" (NOT "short-answer")
   - Date questions → "date-picker" (NOT "short-answer")
   - Money/Budget → "currency" (NOT "number")
   - Ranking items → "ranking" (NOT "short-answer")

2. Match the field type to the SEMANTIC meaning of the question
3. Consider the user experience - choose the most intuitive input method
4. For quizzes, use "multiple-choice" or "checkboxes" appropriately
5. Provide confidence scores based on how clear the semantic match is

${isQuiz ? `QUIZ-SPECIFIC RULES (VERY IMPORTANT):
- ALL quiz questions MUST be "multiple-choice" type
- You MUST provide "suggestedOptions" array with 4 answer choices for EVERY question
- One option should be the correct answer, others should be plausible but incorrect distractors
- For questions about formulas, equations, or calculations, provide the actual answers as options (e.g., "H₂O", "2Ca + O₂ → 2CaO")
- Make distractors realistic - common misconceptions or similar-looking answers
- NEVER leave suggestedOptions empty for quiz questions` : ''}

Return JSON array with analysis for each field.`;

  const userPrompt = `Analyze these form fields and recommend optimal field types:

FORM CONTEXT: ${formContext || 'General form'}
${isQuiz ? 'THIS IS A QUIZ - All questions MUST have multiple-choice options generated!' : ''}

FIELDS TO ANALYZE:
${JSON.stringify(fields, null, 2)}

For each field, return:
{
  "recommendedType": "optimal-field-type",
  "confidence": 0.0-1.0,
  "reasoning": "Why this type is best",
  "alternativeTypes": ["backup", "options"],
  "suggestedPlaceholder": "if applicable",
  "suggestedHelpText": "if helpful",
  "suggestedOptions": ["option1", "option2", "option3", "option4"]${isQuiz ? ' // REQUIRED for quiz - provide 4 actual answer choices' : ' // if choice field'},
  "suggestedCorrectAnswer": "the correct option text"${isQuiz ? ' // REQUIRED - must exactly match one of the suggestedOptions' : ' // if quiz'}
}

Return a JSON array with one result per input field, in the same order.`;

  try {
    console.log('         🤖 [Semantic Analyzer] Calling AI model for semantic analysis...');
    const startTime = Date.now();
    
    const result = await getAICompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      maxTokens: 3000,
      responseFormat: 'json',
      model: GEMINI_MODELS.FLASH_LITE // Use Flash-Lite for semantic analysis
    });

    const elapsed = Date.now() - startTime;
    console.log(`         ✅ [Semantic Analyzer] AI analysis completed in ${elapsed}ms`);

    const parsed = JSON.parse(result.content);
    
    // Handle both array and object with results property
    const results = Array.isArray(parsed) ? parsed : (parsed.results || parsed.fields || []);
    
    // First pass: identify fields that need AI-generated options
    const fieldsNeedingOptions: { index: number; label: string; helpText?: string }[] = [];
    
    // Log analysis results
    let upgradeCount = 0;
    const preliminaryResults = results.map((r: Record<string, unknown>, idx: number) => {
      let recommended = (r.recommendedType as FieldTypeKey) || fields[idx].currentType || 'short-answer';
      const original = fields[idx].currentType || 'unknown';
      let suggestedOptions = r.suggestedOptions as string[] | undefined;
      let suggestedCorrectAnswer = r.suggestedCorrectAnswer as string | undefined;
      let needsOptionGeneration = false;
      
      // FORCE quiz fields to be multiple-choice if they're text fields
      if (isQuiz && (recommended === 'short-answer' || recommended === 'long-answer' || original === 'short-answer' || original === 'long-answer')) {
        recommended = 'multiple-choice';
        console.log(`         🎯 [Semantic Analyzer] QUIZ OVERRIDE: "${fields[idx].label.substring(0, 25)}..." ${original} ➜ multiple-choice (FORCED)`);
        upgradeCount++;
        
        // Check if AI provided valid options
        if (!suggestedOptions || suggestedOptions.length === 0 || suggestedOptions.every(opt => !opt || opt.trim() === '')) {
          needsOptionGeneration = true;
        }
      } else if (recommended !== original) {
        upgradeCount++;
        console.log(`         📈 [Semantic Analyzer] "${fields[idx].label.substring(0, 25)}..." → ${original} ➜ ${recommended} (${((r.confidence as number) * 100).toFixed(0)}% conf)`);
      }
      
      // Ensure multiple-choice fields have options
      if (recommended === 'multiple-choice' && (!suggestedOptions || suggestedOptions.length === 0)) {
        suggestedOptions = r.suggestedOptions as string[] || fields[idx].options;
        if (!suggestedOptions || suggestedOptions.length === 0) {
          needsOptionGeneration = true;
        }
      }
      
      // Track fields that need AI option generation
      if (needsOptionGeneration) {
        fieldsNeedingOptions.push({
          index: idx,
          label: fields[idx].label,
          helpText: fields[idx].helpText,
        });
      }
      
      // If we have options but no correct answer for a quiz, try to set first option as fallback
      if (isQuiz && suggestedOptions && suggestedOptions.length > 0 && !suggestedCorrectAnswer) {
        suggestedCorrectAnswer = (r.suggestedCorrectAnswer as string) || suggestedOptions[0];
      }
      
      return {
        recommendedType: recommended,
        confidence: (r.confidence as number) || 0.5,
        reasoning: (r.reasoning as string) || '',
        alternativeTypes: r.alternativeTypes as FieldTypeKey[] | undefined,
        suggestedOptions: suggestedOptions,
        suggestedCorrectAnswer: suggestedCorrectAnswer,
        suggestedPlaceholder: r.suggestedPlaceholder as string | undefined,
        suggestedHelpText: r.suggestedHelpText as string | undefined,
        suggestedValidation: r.suggestedValidation as Record<string, unknown> | undefined,
        needsOptionGeneration,
      };
    });
    
    // Second pass: batch generate options for fields that need them using AI
    if (fieldsNeedingOptions.length > 0) {
      console.log(`         🧠 [Semantic Analyzer] ${fieldsNeedingOptions.length} questions need AI-generated options...`);
      
      const generatedOptions = await batchGenerateQuizOptions(fieldsNeedingOptions);
      
      // Apply generated options to results
      fieldsNeedingOptions.forEach((field, genIdx) => {
        const result = preliminaryResults[field.index];
        const generated = generatedOptions[genIdx];
        
        if (generated && generated.options && generated.options.length > 0) {
          result.suggestedOptions = generated.options;
          result.suggestedCorrectAnswer = generated.correctAnswer;
          console.log(`         ✅ [Semantic Analyzer] Options generated for: "${field.label.substring(0, 30)}..."`);
        }
      });
    }
    
    // Clean up the internal flag before returning
    const analysisResults = preliminaryResults.map((r: FieldAnalysisResult & { needsOptionGeneration?: boolean }) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { needsOptionGeneration, ...rest } = r;
      return rest as FieldAnalysisResult;
    });
    
    console.log(`         📊 [Semantic Analyzer] Summary: ${upgradeCount} field type upgrades recommended`);
    return analysisResults;
  } catch (error) {
    console.error('         ❌ [Semantic Analyzer] AI analysis failed, using local fallback');
    console.error('         ', error instanceof Error ? error.message : error);
    // Return basic analysis using pattern matching as fallback
    console.log('         🔄 [Semantic Analyzer] Running local pattern matching fallback...');
    return fields.map(f => analyzeFieldLocally(f));
  }
}

/**
 * Local pattern-based field analysis (fallback when AI unavailable)
 */
function analyzeFieldLocally(field: FieldAnalysisInput): FieldAnalysisResult {
  const label = field.label.toLowerCase();
  const optionCount = field.options?.length || 0;

  // Email detection
  if (label.includes('email') || label.includes('e-mail')) {
    return { recommendedType: 'email', confidence: 0.95, reasoning: 'Contains "email"' };
  }

  // Phone detection
  if (label.includes('phone') || label.includes('mobile') || label.includes('cell') || label.includes('telephone')) {
    return { recommendedType: 'phone', confidence: 0.95, reasoning: 'Phone number field' };
  }

  // Binary/Yes-No detection
  if (
    (optionCount === 2 && field.options?.some(o => o.toLowerCase() === 'yes' || o.toLowerCase() === 'no')) ||
    label.includes('will you') ||
    label.includes('are you') ||
    label.includes('do you agree') ||
    label.includes('attending')
  ) {
    return { recommendedType: 'switch', confidence: 0.9, reasoning: 'Binary yes/no question' };
  }

  // Rating detection
  if (label.includes('rate') || label.includes('rating') || label.includes('satisfied') || label.includes('out of 5')) {
    return { recommendedType: 'star-rating', confidence: 0.9, reasoning: 'Rating question' };
  }

  // Scale/Likert detection
  if (label.includes('agree') || label.includes('likely') || label.includes('recommend') || label.includes('scale of')) {
    return { recommendedType: 'opinion-scale', confidence: 0.85, reasoning: 'Opinion/Likert scale' };
  }

  // Date detection
  if (label.includes('date') || label.includes('when') || label.includes('birthday') || label.includes('born')) {
    return { recommendedType: 'date-picker', confidence: 0.9, reasoning: 'Date field' };
  }

  // Time detection
  if (label.includes('time') || label.includes('what time')) {
    return { recommendedType: 'time-picker', confidence: 0.85, reasoning: 'Time field' };
  }

  // File upload detection
  if (label.includes('upload') || label.includes('attach') || label.includes('resume') || label.includes('cv') || label.includes('file')) {
    return { recommendedType: 'file-uploader', confidence: 0.9, reasoning: 'File upload field' };
  }

  // Currency detection
  if (label.includes('price') || label.includes('cost') || label.includes('budget') || label.includes('salary') || label.includes('$')) {
    return { recommendedType: 'currency', confidence: 0.85, reasoning: 'Currency/money field' };
  }

  // Number detection
  if (label.includes('how many') || label.includes('number of') || label.includes('quantity') || label.includes('age')) {
    return { recommendedType: 'number', confidence: 0.8, reasoning: 'Numeric field' };
  }

  // Address detection
  if (label.includes('address') || label.includes('location') || label.includes('street')) {
    return { recommendedType: 'address', confidence: 0.85, reasoning: 'Address field' };
  }

  // Long answer detection
  if (label.includes('describe') || label.includes('explain') || label.includes('tell us') || label.includes('comments') || label.includes('feedback') || label.includes('message')) {
    return { recommendedType: 'long-answer', confidence: 0.85, reasoning: 'Detailed response needed' };
  }

  // Dropdown for many options
  if (optionCount > 5 && field.currentType !== 'checkboxes') {
    return { recommendedType: 'dropdown', confidence: 0.8, reasoning: 'Many options - dropdown is better UX' };
  }

  // Multiple selection detection
  if (label.includes('select all') || label.includes('all that apply') || label.includes('multiple')) {
    return { recommendedType: 'checkboxes', confidence: 0.85, reasoning: 'Multiple selection allowed' };
  }

  // Ranking detection
  if (label.includes('rank') || label.includes('order') || label.includes('prioritize')) {
    return { recommendedType: 'ranking', confidence: 0.85, reasoning: 'Ranking/ordering question' };
  }

  // Default fallback
  if (field.options && optionCount > 0 && optionCount <= 5) {
    return { recommendedType: 'multiple-choice', confidence: 0.6, reasoning: 'Default for few options' };
  }

  return { recommendedType: 'short-answer', confidence: 0.5, reasoning: 'Default text input' };
}

// ============================================================================
// FIELD TYPE CONVERSION MAP
// ============================================================================

/**
 * Map generic/old field types to optimal new types based on context
 */
export const FIELD_TYPE_UPGRADE_MAP: Record<string, (field: FieldAnalysisInput) => FieldTypeKey> = {
  'text': (field) => {
    const label = field.label.toLowerCase();
    if (label.includes('email')) return 'email';
    if (label.includes('phone')) return 'phone';
    if (label.includes('address')) return 'address';
    if (label.includes('describe') || label.includes('explain')) return 'long-answer';
    return 'short-answer';
  },
  'textarea': () => 'long-answer',
  'radio': (field) => {
    const options = field.options || [];
    if (options.length === 2 && options.some(o => ['yes', 'no', 'true', 'false'].includes(o.toLowerCase()))) {
      return 'switch';
    }
    if (options.length > 5) return 'dropdown';
    return 'multiple-choice';
  },
  'select': (field) => {
    const options = field.options || [];
    if (options.length <= 5) return 'multiple-choice';
    return 'dropdown';
  },
  'checkbox': (field) => {
    const options = field.options || [];
    if (options.length === 1) return 'switch';
    return 'checkboxes';
  },
  'date': () => 'date-picker',
  'tel': () => 'phone',
  'url': () => 'short-answer', // URL stays as short-answer with validation
  'number': (field) => {
    const label = field.label.toLowerCase();
    if (label.includes('rate') || label.includes('rating') || label.includes('satisfied')) return 'star-rating';
    if (label.includes('budget') || label.includes('price') || label.includes('cost') || label.includes('salary')) return 'currency';
    if (label.includes('agree') || label.includes('likely') || label.includes('recommend')) return 'opinion-scale';
    return 'number';
  },
};

/**
 * Upgrade a field type based on semantic analysis
 */
export function upgradeFieldType(currentType: string, field: FieldAnalysisInput): FieldTypeKey {
  const upgrader = FIELD_TYPE_UPGRADE_MAP[currentType];
  if (upgrader) {
    return upgrader(field);
  }
  return currentType as FieldTypeKey;
}
