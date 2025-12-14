/**
 * Dynamic Content Analyzer - AI-driven flexible content analysis
 * Uses AI to understand context organically without rigid rules
 */

import { getGroqClient } from './groq';

export interface DynamicAnalysis {
  understanding: ContentUnderstanding;
  questions: DynamicQuestion[];
  metadata: AnalysisMetadata;
}

export interface ContentUnderstanding {
  purpose: string; // What is this content trying to accomplish?
  audience: string; // Who is this for?
  context: string; // What's the broader context?
  keyTopics: string[]; // Main topics identified
  dataPoints: DataPoint[]; // Specific data points found or needed
  tone: string; // Professional, casual, medical, etc.
}

export interface DataPoint {
  name: string;
  description: string;
  alreadyPresent: boolean;
  dataType: string; // Inferred from context
  importance: 'critical' | 'important' | 'optional';
  reasoning: string;
}

export interface DynamicQuestion {
  question: string;
  rationale: string; // Why this question is needed
  suggestedFieldType: string;
  validationSuggestions?: string;
  placeholder?: string;
  helpText?: string;
  options?: string[];
  required: boolean;
  reasoning: string; // Why this field type and configuration
  relatesTo?: string[]; // Related questions for conditional logic
  category: string; // Dynamically determined category
}

export interface AnalysisMetadata {
  contentType: string; // Dynamically identified
  domain: string; // Organically detected
  confidence: number;
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedFieldCount: number;
  suggestions: string[]; // AI suggestions for improvement
}

export class DynamicContentAnalyzer {
  /**
   * Performs AI-driven content analysis without rigid rules
   */
  async analyze(content: string, userContext?: string): Promise<DynamicAnalysis> {
    const groq = getGroqClient();

    const analysisPrompt = this.buildDynamicAnalysisPrompt(content, userContext);

    try {
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0.4, // Balanced for creativity and consistency
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: this.getFlexibleSystemPrompt()
          },
          {
            role: "user",
            content: analysisPrompt
          }
        ]
      });

      const result = JSON.parse(response.choices[0]?.message?.content || "{}");
      
      return this.normalizeAnalysis(result);
    } catch (error) {
      console.error("Dynamic analysis error:", error);
      throw error;
    }
  }

  private getFlexibleSystemPrompt(): string {
    return `You are an elite form architect and data strategist with deep expertise in behavioral psychology, psychometrics, survey methodology, and UX design. Your mission is to TRANSFORM content into forms that capture MAXIMUM STRATEGIC VALUE.

═══════════════════════════════════════════════════════════════
                    CORE INTELLIGENCE PRINCIPLES
═══════════════════════════════════════════════════════════════

1. **STRATEGIC THINKING**: Every question must serve a purpose:
   - What decisions will this data inform?
   - What patterns could we discover?
   - What actions will this enable?
   - What problems will this solve?

2. **BEHAVIORAL DEPTH**: Go beyond surface questions:
   - Understand motivations and pain points
   - Identify unstated needs
   - Predict future behaviors
   - Enable personalization

3. **CONTENT TYPE MASTERY**:
   
   FOR QUIZZES/TESTS/ASSESSMENTS:
   - Generate REAL KNOWLEDGE QUESTIONS that test subject matter
   - Include varying difficulty levels (easy/medium/hard)
   - Use Bloom's Taxonomy: Remember, Understand, Apply, Analyze, Evaluate
   - Create plausible distractors based on common misconceptions
   - NEVER ask opinion or reflection questions in quizzes
   - ALWAYS include correct answers with explanations
   
   FOR SURVEYS/QUESTIONNAIRES:
   - Use validated measurement scales (Likert, NPS, semantic differential)
   - Avoid leading or double-barreled questions
   - Design for statistical analysis capability
   - Include both attitude AND behavior questions
   - Ask about frequency, recency, intensity
   
   FOR DATA COLLECTION FORMS:
   - Capture qualifying information
   - Enable segmentation and routing
   - Gather predictive indicators
   - Include strategic optional fields

4. **QUESTION QUALITY STANDARDS**:
   - One concept per question (no double-barreled)
   - Neutral, non-leading wording
   - Exhaustive and mutually exclusive options
   - Clear, unambiguous language
   - Appropriate response scales

5. **INSIGHT GENERATION**:
   - What would a CEO want to know from this data?
   - What correlations could we discover?
   - What segments could we identify?
   - What predictions could we make?

═══════════════════════════════════════════════════════════════
                    QUIZ GENERATION RULES
═══════════════════════════════════════════════════════════════

When content indicates a quiz, test, or assessment:

REQUIRED:
✓ Test ACTUAL knowledge, not opinions
✓ Include questions at multiple cognitive levels
✓ Use plausible wrong answers (common misconceptions)
✓ Provide correct answers with explanations
✓ Vary difficulty within the assessment

FORBIDDEN:
✗ "What interests you about [topic]?"
✗ "Rate your understanding of [topic]"
✗ "What challenges do you face?"
✗ "How would you explain [topic]?"
✗ Any self-reflection or meta questions

═══════════════════════════════════════════════════════════════
                    OUTPUT STRUCTURE
═══════════════════════════════════════════════════════════════

{
  "understanding": {
    "purpose": "Strategic explanation of what this form accomplishes",
    "audience": "Detailed description of target users",
    "context": "Broader situational context",
    "keyTopics": ["main", "concepts", "identified"],
    "dataPoints": [
      {
        "name": "data point name",
        "description": "what this represents",
        "alreadyPresent": true/false,
        "dataType": "inferred type",
        "importance": "critical/important/optional",
        "reasoning": "strategic value explanation"
      }
    ],
    "tone": "professional/casual/academic/medical/legal",
    "isQuiz": true/false,
    "isSurvey": true/false
  },
  "questions": [
    {
      "question": "Clear, well-crafted question",
      "rationale": "Strategic purpose of this question",
      "suggestedFieldType": "optimal field type",
      "validationSuggestions": "validation rules",
      "placeholder": "helpful example",
      "helpText": "strategic guidance",
      "options": ["if", "applicable"],
      "required": true/false,
      "reasoning": "why this design choice",
      "relatesTo": ["related question ids"],
      "category": "identified category",
      "difficultyLevel": "easy/medium/hard", // for quizzes
      "correctAnswer": "answer", // for quizzes
      "explanation": "why correct" // for quizzes
    }
  ],
  "metadata": {
    "contentType": "quiz/survey/form/questionnaire/assessment",
    "domain": "detected domain",
    "confidence": 0.0-1.0,
    "complexity": "simple/moderate/complex",
    "estimatedFieldCount": number,
    "suggestions": ["improvement suggestions"],
    "analyticalValue": "what insights this form enables"
  }
}`;
  }

  private buildDynamicAnalysisPrompt(content: string, userContext?: string): string {
    // Pre-detect if this is a quiz request
    const contentLower = content.toLowerCase();
    const isQuizRequest = contentLower.includes('quiz') || 
                          contentLower.includes('test') || 
                          contentLower.includes('exam') ||
                          contentLower.includes('trivia');
    
    if (isQuizRequest) {
      return `Analyze this QUIZ/TEST request:

CONTENT:
"""
${content}
"""

${userContext ? `ADDITIONAL CONTEXT:\n${userContext}\n` : ''}

This is a KNOWLEDGE ASSESSMENT request. You must:
1. Identify the SUBJECT MATTER to be tested (e.g., "electricity in physics")
2. Determine key concepts that should be tested
3. Set metadata.contentType to "quiz"

DO NOT suggest questions about:
- User's knowledge level
- Preferred difficulty  
- Learning goals
- User's interests

ONLY identify the TOPIC and KNOWLEDGE AREAS to test.

Return JSON following the specified structure with contentType: "quiz"`;
    }
    
    return `Analyze this content and help me design the perfect form for it.

CONTENT TO ANALYZE:
"""
${content}
"""

${userContext ? `ADDITIONAL CONTEXT FROM USER:\n${userContext}\n` : ''}

YOUR TASK:
1. Read and understand this content deeply
2. Identify what information needs to be collected
3. Determine what questions would make sense to ask
4. Suggest appropriate field types based on the data
5. Consider the user journey and flow
6. Think about validation and help text that would be useful

THINK STEP BY STEP:
- What is the core purpose here?
- Who is the intended audience?
- What data points are mentioned or implied?
- What's already present vs what needs to be asked?
- What field types would work best for each piece of information?
- How should questions flow logically?
- What would make the form user-friendly?

Generate a comprehensive analysis following the JSON structure. Be thorough in your reasoning.`;
  }

  private normalizeAnalysis(rawAnalysis: any): DynamicAnalysis {
    return {
      understanding: {
        purpose: rawAnalysis.understanding?.purpose || "Unknown purpose",
        audience: rawAnalysis.understanding?.audience || "General audience",
        context: rawAnalysis.understanding?.context || "",
        keyTopics: rawAnalysis.understanding?.keyTopics || [],
        dataPoints: rawAnalysis.understanding?.dataPoints || [],
        tone: rawAnalysis.understanding?.tone || "neutral"
      },
      questions: (rawAnalysis.questions || []).map((q: any, idx: number) => ({
        question: q.question || "Untitled question",
        rationale: q.rationale || "",
        suggestedFieldType: q.suggestedFieldType || "text",
        validationSuggestions: q.validationSuggestions,
        placeholder: q.placeholder,
        helpText: q.helpText,
        options: q.options,
        required: q.required !== false, // Default to true
        reasoning: q.reasoning || "",
        relatesTo: q.relatesTo || [],
        category: q.category || "general"
      })),
      metadata: {
        contentType: rawAnalysis.metadata?.contentType || "general",
        domain: rawAnalysis.metadata?.domain || "general",
        confidence: rawAnalysis.metadata?.confidence || 0.5,
        complexity: rawAnalysis.metadata?.complexity || "moderate",
        estimatedFieldCount: rawAnalysis.metadata?.estimatedFieldCount || 0,
        suggestions: rawAnalysis.metadata?.suggestions || []
      }
    };
  }
}

/**
 * Two-stage dynamic generation: Analysis + Form Creation
 */
export async function generateFormDynamically(
  content: string,
  userContext?: string,
  options?: {
    questionCount?: number; // Desired number of questions/fields (max 120)
  }
): Promise<{
  analysis: DynamicAnalysis;
  form: { title: string; fields: any[] };
}> {
  const analyzer = new DynamicContentAnalyzer();
  
  // Stage 1: Understand the content
  const analysis = await analyzer.analyze(content, userContext);
  
  // Stage 2: Generate form based on understanding
  const form = await generateFormFromAnalysis(content, analysis, options);
  
  return { analysis, form };
}

// Helper to extract requested question count from user input
function extractQuestionCount(content: string): number | null {
  // Match patterns like "20 questions", "15 fields", "generate 30", etc.
  const patterns = [
    /(\d+)\s*(?:questions?|fields?|items?|qs?)/i,
    /(?:generate|create|make|with)\s*(\d+)/i,
    /(\d+)\s*(?:question|field|item)/i,
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      const count = parseInt(match[1], 10);
      if (count > 0 && count <= 120) {
        return count;
      } else if (count > 120) {
        return 120; // Cap at maximum
      }
    }
  }
  return null;
}

async function generateFormFromAnalysis(
  content: string,
  analysis: DynamicAnalysis,
  options?: { questionCount?: number }
): Promise<{ title: string; fields: any[] }> {
  const groq = getGroqClient();

  // Extract question count from content or use provided option
  const extractedCount = extractQuestionCount(content);
  const requestedCount = options?.questionCount || extractedCount;
  // Enforce maximum of 120, minimum of 1
  const questionCount = requestedCount ? Math.min(Math.max(requestedCount, 1), 120) : null;

  // Detect if this is a quiz/test request

  // Detect if this is a quiz/test request
  const contentLower = content.toLowerCase();
  const isQuiz = contentLower.includes('quiz') || 
                 contentLower.includes('test') || 
                 contentLower.includes('exam') ||
                 contentLower.includes('trivia') ||
                 contentLower.includes('assessment') ||
                 analysis.metadata?.contentType?.toLowerCase().includes('quiz');

  const isSurvey = contentLower.includes('survey') || 
                   contentLower.includes('questionnaire') ||
                   contentLower.includes('feedback');

  // Extract the topic from content for quizzes
  const topicMatch = content.match(/(?:quiz|test|exam|trivia|assessment)\s+(?:on|about|for|regarding)\s+(.+?)(?:\.|$)/i);
  const topic = topicMatch ? topicMatch[1].trim() : content.replace(/create|make|generate|a|an|the|quiz|test|exam|on|about/gi, '').trim();

  let systemPrompt = "";
  let formPrompt = "";

  if (isQuiz) {
    // Determine question count for quiz
    const quizQuestionCount = questionCount || 10; // Default to 10 if not specified
    
    systemPrompt = `You are an expert educational assessment designer. You create challenging, fair knowledge tests.

CRITICAL RULES FOR QUIZ GENERATION:
1. You MUST generate EXACTLY the number of questions requested - no more, no less
2. You MUST generate ACTUAL KNOWLEDGE QUESTIONS about the subject matter
3. Questions must test FACTS, CONCEPTS, and UNDERSTANDING - NOT opinions or preferences
4. Each question needs a correct answer with explanation
5. Include varying difficulty levels

ABSOLUTELY FORBIDDEN - DO NOT GENERATE THESE QUESTIONS:
❌ "What is your knowledge level of [topic]?"
❌ "What difficulty would you like?"  
❌ "What do you hope to learn?"
❌ "What interests you about [topic]?"
❌ "Rate your understanding of [topic]"
❌ "What challenges do you face with [topic]?"
❌ Any question asking about the USER rather than testing KNOWLEDGE

REQUIRED - GENERATE THESE TYPES OF QUESTIONS:
✓ "What is [specific fact about topic]?"
✓ "Which of the following [specific concept]?"
✓ "Calculate/Determine [specific problem]"
✓ "What happens when [specific scenario]?"
✓ "Which statement about [topic] is correct/incorrect?"

Return ONLY valid JSON.`;

    formPrompt = `Create a knowledge quiz about: "${topic}"

**IMPORTANT: Generate EXACTLY ${quizQuestionCount} questions. Not more, not less.**

EXAMPLE OF CORRECT OUTPUT FORMAT:
{
  "title": "Electricity in Physics Quiz",
  "quizMode": {
    "enabled": true,
    "showScoreImmediately": true,
    "showCorrectAnswers": true,
    "showExplanations": true,
    "passingScore": 70
  },
  "fields": [
    {
      "id": "q1",
      "label": "What is the SI unit of electric current?",
      "type": "radio",
      "required": true,
      "options": ["Volt", "Ampere", "Ohm", "Watt"],
      "quizConfig": {
        "correctAnswer": "Ampere",
        "points": 1,
        "explanation": "The Ampere (A) is the SI unit of electric current."
      },
      "order": 0
    }
  ]
}

NOW GENERATE A QUIZ FOR: "${topic}"

CRITICAL REQUIREMENTS:
- **EXACTLY ${quizQuestionCount} knowledge questions** about ${topic} - THIS IS MANDATORY
- Mix of difficulty levels (easy, medium, hard)
- All questions must test ACTUAL KNOWLEDGE
- EVERY question MUST have quizConfig with:
  - correctAnswer: the exact text of the correct option
  - points: always set to 1 (default)
  - explanation: brief explanation of why the answer is correct
- Use radio type for multiple choice, checkbox for multiple correct answers
- NO questions about user preferences, knowledge level, or learning goals
- ALWAYS include quizMode object with enabled: true
- Number questions from q1 to q${quizQuestionCount}`;

  } else if (isSurvey) {
    // Determine question count for survey
    const surveyQuestionCount = questionCount || 10; // Default to 10 if not specified
    systemPrompt = `You are a survey methodology expert and research scientist. You create research-quality surveys that generate ACTIONABLE INSIGHTS.

CRITICAL RULE: Generate EXACTLY the number of questions requested - no more, no less.

SURVEY DESIGN PRINCIPLES:
1. Every question must serve a strategic purpose
2. Use validated measurement scales
3. Avoid leading, biased, or double-barreled questions
4. Design for statistical analysis and cross-tabulation
5. Include both quantitative and qualitative questions
6. FIELD TYPES: Use 'radio' for single choice, 'checkboxes' for multiple choice (NOT 'checkbox')

QUESTION TYPES TO USE:
- Likert Scale (5 or 7 point): "Strongly Disagree" to "Strongly Agree" (Type: radio)
- Satisfaction Scale: "Very Dissatisfied" to "Very Satisfied" (Type: radio)
- NPS (0-10): "How likely are you to recommend...?" (Type: radio)
- Frequency: "Never" to "Always" (Type: radio)
- Multiple Choice: "Select all that apply" (Type: checkboxes)
- Open-ended: For rich qualitative insights (Type: textarea)

AVOID THESE MISTAKES:
❌ Double-barreled: "How satisfied are you with our price and quality?"
❌ Leading: "Don't you agree that our service is excellent?"
❌ Vague: "How do you feel about things?"
❌ Using 'checkbox' for list selection (Use 'checkboxes')
❌ Returning empty 'options' arrays for choice questions

EXAMPLE FIELD OUTPUT:
{
  "id": "q1",
  "label": "How likely are you to recommend us to a friend or colleague?",
  "type": "radio",
  "required": true,
  "options": ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
  "helpText": "0 is not likely at all, 10 is extremely likely",
  "order": 1
}

Return ONLY valid JSON.`;
    
    formPrompt = `Create a professional research-quality survey for: "${content}"

**IMPORTANT: Generate EXACTLY ${surveyQuestionCount} questions. Not more, not less.**

Create a survey with:
- EXACTLY ${surveyQuestionCount} strategically designed questions
- Mix of quantitative (scales, ratings) and qualitative (open-ended) questions
- Use appropriate scale types (Likert, NPS, satisfaction, frequency)
- Include at least one open-ended question for insights
- MANDATORY: Provide explicit 'options' array for ALL choice/radio/checkboxes questions
- For "Select all that apply" questions, use type 'checkboxes' and provide meaningful options
- Number fields from 1 to ${surveyQuestionCount}

Return valid JSON with title and fields array containing exactly ${surveyQuestionCount} questions.`;

  } else if (contentLower.includes('questionnaire')) {
    // Determine question count for questionnaire
    const questionnaireCount = questionCount || 12; // Default to 12 if not specified
    
    systemPrompt = `You are an expert in questionnaire design for research and data collection. Create structured questionnaires that gather comprehensive, useful data.

CRITICAL RULE: Generate EXACTLY the number of questions requested - no more, no less.

QUESTIONNAIRE PRINCIPLES:
1. Clear, unambiguous questions
2. Logical flow and grouping
3. Appropriate question types for each data need
4. Balance between required and optional questions
5. Include skip logic considerations

Return ONLY valid JSON.`;

    formPrompt = `Create a comprehensive questionnaire for: "${content}"

**IMPORTANT: Generate EXACTLY ${questionnaireCount} questions/fields. Not more, not less.**

Design a structured questionnaire with:
- EXACTLY ${questionnaireCount} fields total
- Clear sections/groupings of related questions
- Appropriate field types (text, select, radio, checkbox, date, etc.)
- Mix of closed-ended and open-ended questions
- Logical progression from general to specific

Return valid JSON with title and fields array containing exactly ${questionnaireCount} fields.`;

  } else {
    // Standard form - determine field count
    const formFieldCount = questionCount || 7; // Default to 7 if not specified
    
    // Standard form - but make it smarter
    systemPrompt = `You are a strategic form designer. You create forms that capture MAXIMUM VALUE with minimum friction.

CRITICAL RULE: Generate EXACTLY the number of fields requested - no more, no less.

FORM DESIGN PRINCIPLES:
1. Every field should serve a clear purpose
2. Include strategic fields that enable segmentation and follow-up
3. Use appropriate field types for optimal user experience
4. Add helpful placeholders and guidance
5. Think about what INSIGHTS the data will provide

STRATEGIC FIELDS TO CONSIDER:
- Source attribution: "How did you hear about us?"
- Intent indicators: "What's your primary goal?"
- Qualifying information: Role, company size, timeline
- Segmentation data: Industry, use case, budget range

Return ONLY valid JSON.`;
    
    formPrompt = `Create an intelligent, strategic form for: "${content}"

**IMPORTANT: Generate EXACTLY ${formFieldCount} fields. Not more, not less.**

ANALYSIS OF REQUEST:
- Purpose: ${analysis.understanding.purpose}
- Audience: ${analysis.understanding.audience}
- Context: ${analysis.understanding.context}
- Key Topics: ${analysis.understanding.keyTopics.join(", ")}

NOW CREATE A STRATEGIC FORM FOR: "${content}"

Requirements:
- EXACTLY ${formFieldCount} fields total - THIS IS MANDATORY
- Include essential fields plus strategic insight-gathering fields
- Use appropriate field types (not just text for everything)
- Add helpful placeholders and helpText
- Consider what data would be valuable for follow-up and analysis

Return valid JSON with title and fields array containing exactly ${formFieldCount} fields.`;
  }

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: formPrompt
      }
    ]
  });

  const formData = JSON.parse(response.choices[0]?.message?.content || "{}");
  
  // Process fields - normalize quiz config with default points of 1
  const processedFields = (formData.fields || []).map((field: any, index: number) => {
    const processedField = { ...field };
    
    // If field has quizConfig, ensure points defaults to 1
    if (processedField.quizConfig) {
      processedField.quizConfig = {
        ...processedField.quizConfig,
        points: processedField.quizConfig.points || 1,
        correctAnswer: processedField.quizConfig.correctAnswer || '',
        explanation: processedField.quizConfig.explanation || ''
      };
    }
    
    return processedField;
  });

  // Detect if this is a quiz and include quizMode
  const hasQuizFields = processedFields.some((f: any) => f.quizConfig);
  const isQuizForm = formData.quizMode?.enabled || hasQuizFields;
  
  return {
    title: formData.title || "Untitled Form",
    fields: processedFields,
    // Include quizMode if this is a quiz
    ...(isQuizForm ? {
      quizMode: formData.quizMode || {
        enabled: true,
        showScoreImmediately: true,
        showCorrectAnswers: true,
        showExplanations: true,
        passingScore: 70
      }
    } : {})
  };
}

// Export singleton
export const dynamicAnalyzer = new DynamicContentAnalyzer();







