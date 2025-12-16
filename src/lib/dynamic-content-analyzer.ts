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

  // Enhanced flexible form type detection
  const contentLower = content.toLowerCase();
  
  // Quiz/Test detection
  const isQuiz = contentLower.includes('quiz') || 
                 contentLower.includes('test') || 
                 contentLower.includes('exam') ||
                 contentLower.includes('trivia') ||
                 contentLower.includes('assessment') ||
                 analysis.metadata?.contentType?.toLowerCase().includes('quiz');

  // Survey/Questionnaire detection
  const isSurvey = contentLower.includes('survey') || 
                   contentLower.includes('questionnaire') ||
                   contentLower.includes('feedback') ||
                   contentLower.includes('poll') ||
                   contentLower.includes('opinion');

  // RSVP/Event Response detection
  const isRSVP = contentLower.includes('rsvp') || 
                 contentLower.includes('invitation') ||
                 contentLower.includes('event response') ||
                 contentLower.includes('attendance') ||
                 contentLower.includes('will you attend') ||
                 contentLower.includes('party') ||
                 contentLower.includes('wedding') ||
                 contentLower.includes('celebration') ||
                 contentLower.includes('ceremony');

  // Registration/Signup detection
  const isRegistration = contentLower.includes('registration') ||
                         contentLower.includes('signup') ||
                         contentLower.includes('sign up') ||
                         contentLower.includes('sign-up') ||
                         contentLower.includes('register') ||
                         contentLower.includes('enroll') ||
                         contentLower.includes('enrollment') ||
                         contentLower.includes('join') ||
                         contentLower.includes('membership');

  // Booking/Appointment detection
  const isBooking = contentLower.includes('booking') ||
                    contentLower.includes('appointment') ||
                    contentLower.includes('reservation') ||
                    contentLower.includes('schedule') ||
                    contentLower.includes('book a') ||
                    contentLower.includes('reserve');

  // Order/Purchase detection
  const isOrder = contentLower.includes('order') ||
                  contentLower.includes('purchase') ||
                  contentLower.includes('buy') ||
                  contentLower.includes('checkout') ||
                  contentLower.includes('shopping');

  // Application detection
  const isApplication = contentLower.includes('application') ||
                        contentLower.includes('apply') ||
                        contentLower.includes('job') ||
                        contentLower.includes('position') ||
                        contentLower.includes('candidate') ||
                        contentLower.includes('resume') ||
                        contentLower.includes('cv');

  // Contact/Inquiry detection
  const isContact = contentLower.includes('contact') ||
                    contentLower.includes('inquiry') ||
                    contentLower.includes('enquiry') ||
                    contentLower.includes('get in touch') ||
                    contentLower.includes('reach out') ||
                    contentLower.includes('message us');

  // Consent/Agreement detection  
  const isConsent = contentLower.includes('consent') ||
                    contentLower.includes('agreement') ||
                    contentLower.includes('permission') ||
                    contentLower.includes('waiver') ||
                    contentLower.includes('terms') ||
                    contentLower.includes('gdpr') ||
                    contentLower.includes('privacy');

  // Petition/Signature detection
  const isPetition = contentLower.includes('petition') ||
                     contentLower.includes('signature') ||
                     contentLower.includes('sign this') ||
                     contentLower.includes('support') ||
                     contentLower.includes('pledge');

  // Donation/Contribution detection
  const isDonation = contentLower.includes('donation') ||
                     contentLower.includes('donate') ||
                     contentLower.includes('contribute') ||
                     contentLower.includes('fundrais') ||
                     contentLower.includes('charity') ||
                     contentLower.includes('sponsor');

  // Contest/Competition detection
  const isContest = contentLower.includes('contest') ||
                    contentLower.includes('competition') ||
                    contentLower.includes('giveaway') ||
                    contentLower.includes('sweepstake') ||
                    contentLower.includes('raffle') ||
                    contentLower.includes('enter to win');

  // Review/Rating detection
  const isReview = contentLower.includes('review') ||
                   contentLower.includes('rating') ||
                   contentLower.includes('rate us') ||
                   contentLower.includes('testimonial') ||
                   contentLower.includes('experience');

  // Volunteer detection
  const isVolunteer = contentLower.includes('volunteer') ||
                      contentLower.includes('help out') ||
                      contentLower.includes('participate');

  // Request/Support detection
  const isRequest = contentLower.includes('request') ||
                    contentLower.includes('support ticket') ||
                    contentLower.includes('help desk') ||
                    contentLower.includes('issue report') ||
                    contentLower.includes('bug report');

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

  } else if (isRSVP) {
    // RSVP / Event Response form
    const rsvpFieldCount = questionCount || 6;
    
    systemPrompt = `You are an expert event planner and RSVP form designer. Create elegant, efficient RSVP and event response forms.

CRITICAL RULE: Generate EXACTLY the number of fields requested.

RSVP FORM ESSENTIALS:
1. Attendance confirmation (Yes/No/Maybe)
2. Guest information (name, email, phone)
3. Number of guests/plus ones
4. Meal preferences or dietary restrictions
5. Special accommodations needed
6. Optional message to host

Use appropriate field types:
- radio for Yes/No/Maybe attendance
- number for guest count
- select for meal choices
- textarea for special requests
- checkbox for dietary restrictions (multiple selections)

Return ONLY valid JSON.`;

    formPrompt = `Create an RSVP/event response form for: "${content}"

**IMPORTANT: Generate EXACTLY ${rsvpFieldCount} fields.**

Include relevant fields such as:
- Attendance confirmation
- Guest name and contact info
- Number of guests attending
- Meal/dietary preferences (if applicable)
- Special requests or accommodations
- Message to host (optional)

Return valid JSON with title and fields array.`;

  } else if (isRegistration) {
    // Registration / Signup form
    const registrationFieldCount = questionCount || 8;
    
    systemPrompt = `You are an expert in user registration and signup form design. Create secure, user-friendly registration forms.

CRITICAL RULE: Generate EXACTLY the number of fields requested.

REGISTRATION FORM BEST PRACTICES:
1. Essential identity fields (name, email)
2. Contact information
3. Account security (password if needed)
4. Optional profile information
5. Consent checkboxes for terms/privacy
6. Marketing preferences

Field type guidelines:
- email for email addresses
- tel for phone numbers
- text for names
- select for country/region
- checkbox for consent and preferences
- date for birth dates

Return ONLY valid JSON.`;

    formPrompt = `Create a registration/signup form for: "${content}"

**IMPORTANT: Generate EXACTLY ${registrationFieldCount} fields.**

Include appropriate fields like:
- Name (first/last or full name)
- Email address
- Phone number (if relevant)
- Additional profile info based on context
- Terms acceptance checkbox

Return valid JSON with title and fields array.`;

  } else if (isBooking) {
    // Booking / Appointment form
    const bookingFieldCount = questionCount || 8;
    
    systemPrompt = `You are an expert in booking and appointment scheduling form design. Create efficient, comprehensive booking forms.

CRITICAL RULE: Generate EXACTLY the number of fields requested.

BOOKING FORM ESSENTIALS:
1. Contact information (name, email, phone)
2. Date and time selection
3. Service/appointment type selection
4. Duration or number of guests
5. Special requests or notes
6. Confirmation preferences

Field types:
- date for date selection
- select for time slots
- select/radio for service types
- number for guest count
- textarea for special requests
- tel for phone

Return ONLY valid JSON.`;

    formPrompt = `Create a booking/appointment form for: "${content}"

**IMPORTANT: Generate EXACTLY ${bookingFieldCount} fields.**

Include relevant fields such as:
- Customer name and contact info
- Preferred date and time
- Type of service/appointment
- Number of people (if applicable)
- Special requests
- Confirmation contact preference

Return valid JSON with title and fields array.`;

  } else if (isOrder) {
    // Order / Purchase form
    const orderFieldCount = questionCount || 10;
    
    systemPrompt = `You are an expert in e-commerce and order form design. Create clear, comprehensive order forms.

CRITICAL RULE: Generate EXACTLY the number of fields requested.

ORDER FORM ESSENTIALS:
1. Customer information (name, email, phone)
2. Product/service selection
3. Quantity and variations
4. Shipping/delivery address
5. Payment preferences
6. Delivery instructions

Field types:
- text for names and addresses
- email for email
- tel for phone
- select for product choices, quantities
- number for quantities
- textarea for delivery instructions
- checkbox for add-ons or options

Return ONLY valid JSON.`;

    formPrompt = `Create an order/purchase form for: "${content}"

**IMPORTANT: Generate EXACTLY ${orderFieldCount} fields.**

Include relevant fields such as:
- Customer name and contact
- Product/service selection
- Quantity
- Delivery/shipping information
- Special instructions
- Payment preference (if applicable)

Return valid JSON with title and fields array.`;

  } else if (isApplication) {
    // Job/Program Application form
    const applicationFieldCount = questionCount || 12;
    
    systemPrompt = `You are an expert in application form design for jobs, programs, and opportunities. Create professional, comprehensive application forms.

CRITICAL RULE: Generate EXACTLY the number of fields requested.

APPLICATION FORM ESSENTIALS:
1. Personal information (name, contact)
2. Professional background
3. Qualifications and experience
4. Availability and expectations
5. Supporting documents references
6. Additional relevant questions

Field types:
- text for name, titles, company names
- email for email
- tel for phone
- url for LinkedIn/portfolio
- date for availability dates
- textarea for cover letter, experience descriptions
- select for experience levels, education
- number for years of experience

Return ONLY valid JSON.`;

    formPrompt = `Create an application form for: "${content}"

**IMPORTANT: Generate EXACTLY ${applicationFieldCount} fields.**

Include relevant fields such as:
- Full name and contact information
- Current role/position
- Relevant experience
- Education/qualifications
- Why applying/motivation
- Availability
- References or portfolio links

Return valid JSON with title and fields array.`;

  } else if (isContact) {
    // Contact / Inquiry form
    const contactFieldCount = questionCount || 5;
    
    systemPrompt = `You are an expert in contact and inquiry form design. Create simple, effective contact forms that encourage engagement.

CRITICAL RULE: Generate EXACTLY the number of fields requested.

CONTACT FORM ESSENTIALS:
1. Name
2. Email (required for response)
3. Subject or inquiry type
4. Message
5. Optional: Phone, company, urgency

Keep it simple - don't ask for unnecessary information.

Return ONLY valid JSON.`;

    formPrompt = `Create a contact/inquiry form for: "${content}"

**IMPORTANT: Generate EXACTLY ${contactFieldCount} fields.**

Include essential fields:
- Name
- Email
- Subject or topic (select if categories known)
- Message (textarea)
- Optional additional context fields

Return valid JSON with title and fields array.`;

  } else if (isConsent) {
    // Consent / Agreement form
    const consentFieldCount = questionCount || 6;
    
    systemPrompt = `You are an expert in consent and agreement form design. Create clear, legally-minded consent forms.

CRITICAL RULE: Generate EXACTLY the number of fields requested.

CONSENT FORM ESSENTIALS:
1. Participant/signatory identification
2. Clear consent statements (checkbox for each)
3. Date of consent
4. Optional: Parent/guardian info for minors
5. Contact information
6. Digital signature acknowledgment

Use checkbox type for individual consent items - each consent should be a separate checkbox.

Return ONLY valid JSON.`;

    formPrompt = `Create a consent/agreement form for: "${content}"

**IMPORTANT: Generate EXACTLY ${consentFieldCount} fields.**

Include relevant fields:
- Name of person giving consent
- Email/contact
- Individual consent checkboxes for each agreement point
- Date
- Acknowledgment of understanding

Return valid JSON with title and fields array.`;

  } else if (isPetition) {
    // Petition / Signature form
    const petitionFieldCount = questionCount || 5;
    
    systemPrompt = `You are an expert in petition and signature collection form design. Create engaging forms that encourage participation.

CRITICAL RULE: Generate EXACTLY the number of fields requested.

PETITION FORM ESSENTIALS:
1. Name (required)
2. Email (for verification)
3. Location/region (for geographic representation)
4. Optional comment or reason for support
5. Consent to display name publicly (checkbox)

Keep it simple to maximize signatures.

Return ONLY valid JSON.`;

    formPrompt = `Create a petition/signature form for: "${content}"

**IMPORTANT: Generate EXACTLY ${petitionFieldCount} fields.**

Include essential fields:
- Full name
- Email
- Location (city, state, or country)
- Reason for support (optional textarea)
- Permission checkboxes

Return valid JSON with title and fields array.`;

  } else if (isDonation) {
    // Donation / Contribution form
    const donationFieldCount = questionCount || 8;
    
    systemPrompt = `You are an expert in donation and fundraising form design. Create compelling forms that encourage contributions.

CRITICAL RULE: Generate EXACTLY the number of fields requested.

DONATION FORM ESSENTIALS:
1. Donor information (name, email)
2. Donation amount (preset options + custom)
3. Donation frequency (one-time vs recurring)
4. Dedication/tribute option
5. Anonymous option
6. Contact for acknowledgment

Field types:
- radio for preset amounts
- number for custom amount
- select for frequency
- checkbox for anonymous, dedications
- textarea for messages

Return ONLY valid JSON.`;

    formPrompt = `Create a donation/contribution form for: "${content}"

**IMPORTANT: Generate EXACTLY ${donationFieldCount} fields.**

Include relevant fields:
- Donor name and contact
- Donation amount options
- One-time or recurring selection
- Optional dedication message
- Acknowledgment preferences

Return valid JSON with title and fields array.`;

  } else if (isContest) {
    // Contest / Giveaway entry form
    const contestFieldCount = questionCount || 6;
    
    systemPrompt = `You are an expert in contest and giveaway entry form design. Create engaging, compliant entry forms.

CRITICAL RULE: Generate EXACTLY the number of fields requested.

CONTEST FORM ESSENTIALS:
1. Entrant information (name, email)
2. Age verification (if required)
3. Contest-specific entry (answer, submission, etc.)
4. Terms and eligibility acknowledgment
5. Marketing consent option
6. How they heard about contest

Return ONLY valid JSON.`;

    formPrompt = `Create a contest/giveaway entry form for: "${content}"

**IMPORTANT: Generate EXACTLY ${contestFieldCount} fields.**

Include relevant fields:
- Name and email
- Age confirmation (if needed)
- Entry answer or submission
- Terms acceptance checkbox
- Optional marketing opt-in

Return valid JSON with title and fields array.`;

  } else if (isReview) {
    // Review / Rating form
    const reviewFieldCount = questionCount || 6;
    
    systemPrompt = `You are an expert in review and rating form design. Create forms that capture valuable feedback.

CRITICAL RULE: Generate EXACTLY the number of fields requested.

REVIEW FORM ESSENTIALS:
1. Overall rating (star rating or scale)
2. Specific aspect ratings
3. Written review/comment
4. Reviewer information (optional name)
5. Would recommend? (Yes/No)
6. Date of experience

Use radio/select for ratings, textarea for comments.

Return ONLY valid JSON.`;

    formPrompt = `Create a review/rating form for: "${content}"

**IMPORTANT: Generate EXACTLY ${reviewFieldCount} fields.**

Include relevant fields:
- Overall rating (1-5 scale or similar)
- Specific ratings for key aspects
- Written review/testimonial
- Recommendation question
- Reviewer name (optional)

Return valid JSON with title and fields array.`;

  } else if (isVolunteer) {
    // Volunteer signup form
    const volunteerFieldCount = questionCount || 10;
    
    systemPrompt = `You are an expert in volunteer recruitment form design. Create forms that effectively match volunteers to opportunities.

CRITICAL RULE: Generate EXACTLY the number of fields requested.

VOLUNTEER FORM ESSENTIALS:
1. Personal information (name, contact)
2. Availability (days, times, frequency)
3. Skills and interests
4. Previous volunteer experience
5. Areas of interest/preferred activities
6. Emergency contact
7. Any restrictions or requirements

Return ONLY valid JSON.`;

    formPrompt = `Create a volunteer signup form for: "${content}"

**IMPORTANT: Generate EXACTLY ${volunteerFieldCount} fields.**

Include relevant fields:
- Name and contact information
- Availability (dates, times)
- Skills and interests
- Previous experience
- Preferred volunteer activities
- Emergency contact

Return valid JSON with title and fields array.`;

  } else if (isRequest) {
    // Request / Support ticket form
    const requestFieldCount = questionCount || 7;
    
    systemPrompt = `You are an expert in support request and ticket form design. Create efficient forms for issue reporting and requests.

CRITICAL RULE: Generate EXACTLY the number of fields requested.

REQUEST FORM ESSENTIALS:
1. Contact information
2. Request/issue category
3. Priority/urgency level
4. Detailed description
5. Relevant details (order number, account, etc.)
6. Preferred contact method
7. Attachments reference

Return ONLY valid JSON.`;

    formPrompt = `Create a request/support form for: "${content}"

**IMPORTANT: Generate EXACTLY ${requestFieldCount} fields.**

Include relevant fields:
- Name and contact info
- Issue/request type (select)
- Priority level
- Detailed description (textarea)
- Reference numbers or IDs
- Preferred response method

Return valid JSON with title and fields array.`;

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







