/**
 * Question Enhancer
 * 
 * Uses creative AI model to improve question phrasing,
 * add variation, and enhance user experience
 */

import { executeWithFallback } from './ai-models';

// ============================================================================
// QUESTION ENHANCEMENT TYPES
// ============================================================================

export interface QuestionInput {
  label: string;
  type: string;
  helpText?: string;
  placeholder?: string;
  options?: string[];
  context?: string;
}

export interface EnhancedQuestion {
  label: string;
  labelVariations?: string[];
  helpText?: string;
  placeholder?: string;
  options?: string[];
  tone: 'professional' | 'friendly' | 'casual' | 'formal';
}

export interface EnhancementOptions {
  tone?: 'professional' | 'friendly' | 'casual' | 'formal';
  formType?: string;
  audience?: string;
  avoidRepetition?: boolean;
  maxVariations?: number;
}

// ============================================================================
// QUESTION PHRASING PATTERNS
// ============================================================================

const PHRASING_VARIATIONS: Record<string, string[]> = {
  // Name variations
  'name': [
    'What is your name?',
    'Your name',
    'Full name',
    'What should we call you?',
    'How would you like to be addressed?',
  ],
  // Email variations
  'email': [
    'Email address',
    'Your email',
    "What's your email?",
    'Email (for confirmation)',
    'Best email to reach you',
  ],
  // Phone variations
  'phone': [
    'Phone number',
    'Your phone number',
    'Best number to reach you',
    'Contact number',
    'Mobile number',
  ],
  // Feedback variations
  'feedback': [
    'Any feedback or comments?',
    'Share your thoughts',
    "Anything else you'd like to tell us?",
    'Additional comments',
    'Your feedback matters to us',
  ],
  // Rating variations
  'rating': [
    'How would you rate your experience?',
    'Rate your overall experience',
    'Your rating',
    'How did we do?',
    'Tell us how satisfied you are',
  ],
};

// ============================================================================
// LOCAL ENHANCEMENT (Fast, No API)
// ============================================================================

/**
 * Enhance a question using local patterns (no API call)
 */
export function enhanceQuestionLocally(
  question: QuestionInput,
  options?: EnhancementOptions
): EnhancedQuestion {
  const label = question.label.toLowerCase();
  const tone = options?.tone || 'professional';

  // Find matching pattern
  for (const [key, variations] of Object.entries(PHRASING_VARIATIONS)) {
    if (label.includes(key)) {
      const toneIndex = tone === 'casual' ? 3 : tone === 'friendly' ? 2 : 0;
      return {
        label: variations[Math.min(toneIndex, variations.length - 1)] || question.label,
        labelVariations: variations,
        helpText: question.helpText,
        placeholder: question.placeholder || generatePlaceholder(question),
        options: question.options,
        tone,
      };
    }
  }

  // Default enhancement
  return {
    label: capitalizeFirstLetter(question.label),
    helpText: question.helpText,
    placeholder: question.placeholder || generatePlaceholder(question),
    options: question.options,
    tone,
  };
}

/**
 * Generate a contextual placeholder
 */
function generatePlaceholder(question: QuestionInput): string {
  const label = question.label.toLowerCase();

  if (label.includes('name')) return 'John Doe';
  if (label.includes('email')) return 'you@example.com';
  if (label.includes('phone')) return '(555) 123-4567';
  if (label.includes('company')) return 'Acme Inc.';
  if (label.includes('website') || label.includes('url')) return 'https://';
  if (label.includes('address')) return '123 Main St, City, State';
  if (label.includes('message') || label.includes('comment')) return 'Type your message here...';
  if (label.includes('describe') || label.includes('explain')) return 'Tell us more...';
  
  if (question.type === 'number') return '0';
  if (question.type === 'date-picker') return 'Select a date';
  if (question.type === 'time-picker') return 'Select a time';

  return '';
}

function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================================================================
// AI-POWERED ENHANCEMENT
// ============================================================================

/**
 * Enhance multiple questions using AI (batch operation)
 */
export async function enhanceQuestionsWithAI(
  questions: QuestionInput[],
  options?: EnhancementOptions
): Promise<EnhancedQuestion[]> {
  console.log('         ✍️  [Question Enhancer] Starting enhancement...');
  console.log(`         📊 Questions to enhance: ${questions.length}`);
  console.log(`         🎭 Target tone: ${options?.tone || 'professional'}`);
  console.log(`         📋 Form type: ${options?.formType || 'general'}`);
  
  const systemPrompt = `You are an expert UX writer and form designer. Your task is to enhance form questions to be more engaging, clear, and user-friendly.

ENHANCEMENT PRINCIPLES:
1. Clarity: Questions should be immediately understandable
2. Conciseness: Remove unnecessary words
3. Tone consistency: Match the specified tone
4. Engagement: Make questions feel conversational, not robotic
5. Accessibility: Use simple, inclusive language

TONE GUIDELINES:
- Professional: Clear, direct, business-appropriate
- Friendly: Warm, approachable, conversational
- Casual: Relaxed, informal, fun
- Formal: Polished, respectful, traditional

PLACEHOLDER GUIDELINES:
- Provide realistic example values
- Match the expected input format
- Help users understand what to enter

HELP TEXT GUIDELINES:
- Explain WHY the information is needed
- Provide format hints if relevant
- Keep it brief but helpful

DO NOT:
- Make questions longer than necessary
- Add unnecessary formality
- Change the core meaning of questions
- Generate generic, cookie-cutter text`;

  const userPrompt = `Enhance these form questions:

FORM CONTEXT:
- Tone: ${options?.tone || 'professional'}
- Form Type: ${options?.formType || 'general'}
- Audience: ${options?.audience || 'general public'}

QUESTIONS TO ENHANCE:
${JSON.stringify(questions, null, 2)}

For each question, return:
{
  "label": "Enhanced question text",
  "labelVariations": ["alternative", "phrasings"],
  "helpText": "Helpful context or null",
  "placeholder": "Example value or null",
  "options": ["enhanced", "options"] // if applicable
}

Return a JSON array with one result per input question, in the same order.`;

  try {
    console.log('         🤖 [Question Enhancer] Calling AI model for creative enhancement...');
    const startTime = Date.now();
    
    const result = await executeWithFallback({
      purpose: 'question-enhancement',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.6, // Higher for creativity
      maxTokens: 3000,
      responseFormat: 'json',
      timeoutMs: 4000,
    });

    const elapsed = Date.now() - startTime;
    console.log(`         ✅ [Question Enhancer] AI enhancement completed in ${elapsed}ms`);

    const parsed = JSON.parse(result.content);
    const results = Array.isArray(parsed) ? parsed : (parsed.results || parsed.questions || []);

    // Log some sample enhancements
    let enhancedCount = 0;
    const enhancedResults = results.map((r: Record<string, unknown>, idx: number) => {
      const original = questions[idx].label;
      const enhanced = (r.label as string) || original;
      
      if (enhanced !== original) {
        enhancedCount++;
        if (enhancedCount <= 3) { // Only show first 3
          console.log(`         📝 [Question Enhancer] "${original.substring(0, 30)}..." → "${enhanced.substring(0, 30)}..."`);
        }
      }
      
      return {
        label: enhanced,
        labelVariations: r.labelVariations as string[] | undefined,
        helpText: (r.helpText as string) || questions[idx].helpText,
        placeholder: (r.placeholder as string) || questions[idx].placeholder,
        options: (r.options as string[]) || questions[idx].options,
        tone: options?.tone || 'professional',
      };
    });
    
    console.log(`         📊 [Question Enhancer] Summary: ${enhancedCount} questions improved`);
    return enhancedResults;
  } catch (error) {
    console.error('         ❌ [Question Enhancer] AI enhancement failed, using local patterns');
    console.error('         ', error instanceof Error ? error.message : error);
    // Fallback to local enhancement
    console.log('         🔄 [Question Enhancer] Running local pattern matching fallback...');
    return questions.map(q => enhanceQuestionLocally(q, options));
  }
}

// ============================================================================
// QUIZ QUESTION ENHANCEMENT
// ============================================================================

export interface QuizQuestionInput {
  question: string;
  options: string[];
  correctAnswer: string | string[];
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface EnhancedQuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string | string[];
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  distractorQuality: 'good' | 'needs-improvement';
}

/**
 * Enhance quiz questions - improve distractors, add explanations
 */
export async function enhanceQuizQuestions(
  questions: QuizQuestionInput[],
  topic: string
): Promise<EnhancedQuizQuestion[]> {
  const systemPrompt = `You are an expert educational assessment designer and psychometrician. Your task is to enhance quiz questions for maximum educational value.

ENHANCEMENT PRINCIPLES:
1. Distractors should be PLAUSIBLE but clearly wrong
2. Explanations should teach, not just state the answer
3. Question stems should be clear and unambiguous
4. Options should be grammatically consistent
5. Avoid "all of the above" and "none of the above"

DISTRACTOR QUALITY:
- Good distractors are based on common misconceptions
- They should be similar in length and complexity to the correct answer
- They should require actual knowledge to distinguish from correct answer

EXPLANATION QUALITY:
- Explain WHY the answer is correct
- Address why common wrong answers are incorrect
- Provide additional context when helpful`;

  const userPrompt = `Enhance these quiz questions about "${topic}":

${JSON.stringify(questions, null, 2)}

For each question:
1. Improve the question phrasing if needed
2. Ensure distractors are plausible
3. Add or improve explanations
4. Assess difficulty level

Return JSON array with enhanced questions.`;

  try {
    const result = await executeWithFallback({
      purpose: 'quiz-generation',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.4,
      maxTokens: 4000,
      responseFormat: 'json',
      timeoutMs: 6000,
    });

    const parsed = JSON.parse(result.content);
    const results = Array.isArray(parsed) ? parsed : (parsed.questions || []);

    return results.map((r: Record<string, unknown>, idx: number) => ({
      question: (r.question as string) || questions[idx].question,
      options: (r.options as string[]) || questions[idx].options,
      correctAnswer: (r.correctAnswer as string | string[]) || questions[idx].correctAnswer,
      explanation: (r.explanation as string) || questions[idx].explanation || 'No explanation provided',
      difficulty: (r.difficulty as 'easy' | 'medium' | 'hard') || questions[idx].difficulty || 'medium',
      distractorQuality: (r.distractorQuality as 'good' | 'needs-improvement') || 'good',
    }));
  } catch (error) {
    console.error('[Quiz Enhancer] AI enhancement failed:', error);
    // Return original questions with defaults
    return questions.map(q => ({
      ...q,
      explanation: q.explanation || 'No explanation provided',
      difficulty: q.difficulty || 'medium',
      distractorQuality: 'needs-improvement' as const,
    }));
  }
}

// ============================================================================
// SURVEY QUESTION ENHANCEMENT
// ============================================================================

export interface SurveyQuestionInput {
  question: string;
  type: string;
  options?: string[];
  scale?: string;
}

export interface EnhancedSurveyQuestion {
  question: string;
  type: string;
  options?: string[];
  scale?: string;
  scaleLabels?: { low: string; high: string };
  isLeading: boolean;
  isDoubleBarreled: boolean;
  suggestions?: string[];
}

/**
 * Enhance survey questions for research quality
 */
export async function enhanceSurveyQuestions(
  questions: SurveyQuestionInput[],
  researchGoal?: string
): Promise<EnhancedSurveyQuestion[]> {
  const systemPrompt = `You are a survey methodology expert. Your task is to enhance survey questions for research quality.

SURVEY DESIGN PRINCIPLES:
1. Avoid leading questions (questions that suggest an answer)
2. Avoid double-barreled questions (asking two things at once)
3. Use balanced scales with clear endpoints
4. Ensure response options are exhaustive and mutually exclusive
5. Use neutral language

SCALE RECOMMENDATIONS:
- Satisfaction: Very Dissatisfied → Very Satisfied
- Agreement: Strongly Disagree → Strongly Agree
- Frequency: Never → Always
- Likelihood: Extremely Unlikely → Extremely Likely
- NPS: 0 (Not at all likely) → 10 (Extremely likely)

FLAG ISSUES:
- Leading: "Don't you agree that..." or "How great was..."
- Double-barreled: "How satisfied are you with the price and quality?"`;

  const userPrompt = `Enhance these survey questions${researchGoal ? ` for research goal: "${researchGoal}"` : ''}:

${JSON.stringify(questions, null, 2)}

For each question:
1. Check for leading or double-barreled issues
2. Improve phrasing if needed
3. Suggest better scale labels
4. Provide enhancement suggestions

Return JSON array with analysis and enhancements.`;

  try {
    const result = await executeWithFallback({
      purpose: 'form-generation',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      maxTokens: 3000,
      responseFormat: 'json',
      timeoutMs: 5000,
    });

    const parsed = JSON.parse(result.content);
    const results = Array.isArray(parsed) ? parsed : (parsed.questions || []);

    return results.map((r: Record<string, unknown>, idx: number) => ({
      question: (r.question as string) || questions[idx].question,
      type: questions[idx].type,
      options: (r.options as string[]) || questions[idx].options,
      scale: (r.scale as string) || questions[idx].scale,
      scaleLabels: r.scaleLabels as { low: string; high: string } | undefined,
      isLeading: (r.isLeading as boolean) || false,
      isDoubleBarreled: (r.isDoubleBarreled as boolean) || false,
      suggestions: r.suggestions as string[] | undefined,
    }));
  } catch (error) {
    console.error('[Survey Enhancer] AI enhancement failed:', error);
    return questions.map(q => ({
      ...q,
      isLeading: false,
      isDoubleBarreled: false,
    }));
  }
}
