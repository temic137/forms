import { NextResponse } from "next/server";
import { getAICompletion } from "@/lib/ai-provider";

export const runtime = "nodejs";

type Field = {
  id: string;
  label: string;
  type: "text" | "email" | "textarea" | "number" | "date" | "select" | "radio" | "checkbox" | "tel" | "url";
  required: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
  reasoning?: string; // Why this field was included
  quizConfig?: {
    correctAnswer?: string | string[] | number | boolean;
    points?: number;
    explanation?: string;
  };
};

type ContextAnalysis = {
  purpose: string;
  audience: string;
  domain: string;
  formType: string;
  isQuiz: boolean; // New: Detect if this is a quiz/test
  keyEntities: string[];
  tone: string;
  complexity: "simple" | "moderate" | "complex";
  essentialFields: string[];
  optionalFields: string[];
  insightfulFields: string[];
  strategicQuestions: string[];
  decisionPoints: string[];
  analysisNeeds: string[];
  reasoning: string;
  confidence: number;
};

// Stage 1: Context Analysis - Deep understanding of intent and meaning
function buildContextAnalysisPrompt(): string {
  return `You are an elite strategic analyst and form architect with expertise in behavioral psychology, data science, and user experience. Your mission is to deeply analyze requests and architect forms that capture TRANSFORMATIVE INSIGHTS - information that drives decisions, reveals patterns, and creates genuine value.

CRITICAL ANALYSIS PRINCIPLES:

1. **STRATEGIC INTELLIGENCE**: Every field must serve a strategic purpose:
   - What decisions will this data inform?
   - What patterns could we discover?
   - What actions will this enable?
   - What problems will this solve?

2. **BEHAVIORAL DEPTH**: Go beyond surface questions:
   - What motivates the respondent?
   - What pain points exist?
   - What unstated needs are present?
   - What friction points can we identify?

3. **QUIZ/TEST EXCELLENCE**: For knowledge assessments:
   - Questions must TEST ACTUAL KNOWLEDGE, not opinions
   - Include varying difficulty levels (easy, medium, hard)
   - Use Bloom's Taxonomy: Remember, Understand, Apply, Analyze, Evaluate, Create
   - Avoid trivial questions - challenge the respondent
   - Include distractor options that are plausible but incorrect
   - Test critical thinking, not just memorization

4. **SURVEY/QUESTIONNAIRE SOPHISTICATION**:
   - Use validated question structures (Likert scales, semantic differentials)
   - Avoid leading or biased questions
   - Include questions that reveal correlations
   - Design for statistical analysis capability
   - Consider survey fatigue - prioritize high-value questions

5. **FORM INTELLIGENCE**:
   - Capture qualifying information
   - Enable segmentation and personalization
   - Gather predictive indicators
   - Include open-ended questions for qualitative insights

6. **CONTEXT MASTERY**:
   - Detect domain nuances (healthcare vs wellness, B2B vs B2C)
   - Understand regulatory requirements
   - Recognize cultural considerations
   - Identify industry-specific best practices

KEY THINKING FRAMEWORK:

**FOR ALL CONTENT TYPES:**
- **Foundation Layer**: Essential identifiers (name, email) - necessary but not sufficient
- **Intelligence Layer**: Data that enables smart decisions and personalization
- **Insight Layer**: Questions that reveal hidden patterns, motivations, and opportunities
- **Action Layer**: Information that directly enables next steps and conversions
- **Analysis Layer**: Data points for segmentation, A/B testing, and trend analysis

**FOR QUIZZES AND TESTS (CRITICAL):**
- Questions MUST test ACTUAL SUBJECT KNOWLEDGE
- Include questions at multiple cognitive levels:
  * Recall: "What is...?" "Name the..." "List the..."
  * Understanding: "Explain why..." "What happens when...?"
  * Application: "Given this scenario, what would...?"
  * Analysis: "Compare and contrast..." "What is the relationship between...?"
  * Evaluation: "Which approach is most effective for...?"
- NEVER ask meta-questions like "Why do you want to learn this?" or "What challenges you about this topic?"
- Create questions that a domain expert would consider legitimate
- Include trick questions with plausible wrong answers
- Vary question difficulty within the quiz

**FOR SURVEYS AND QUESTIONNAIRES:**
- Use established measurement scales (NPS, CSAT, Likert 5-7 point)
- Include reverse-coded questions to detect response bias
- Ask about behaviors, not just attitudes (behaviors predict better)
- Include temporal questions (frequency, recency, duration)
- Design for cross-tabulation and correlation analysis

**FOR DATA COLLECTION FORMS:**
- Capture qualifying criteria early
- Include hidden segmentation fields
- Ask about decision-making authority and timeline
- Gather competitive intelligence where appropriate

Return ONLY valid JSON with this structure:
{
  "purpose": "Clear explanation of what this form accomplishes and the STRATEGIC VALUE it provides",
  "audience": "Detailed description of target audience including their expertise level, needs, and context",
  "domain": "healthcare|education|business|government|finance|legal|retail|ecommerce|nonprofit|technology|science|events|hospitality|general",
  "formType": "registration|contact|survey|application|booking|feedback|order|assessment|quiz|questionnaire|research|evaluation|rsvp|petition|donation|consent|contest|review|volunteer|request|poll|other",
  "isQuiz": true|false, // true for ANY knowledge assessment, trivia, test, or exam
  "keyEntities": ["important", "concepts", "mentioned", "or", "implied", "including", "technical", "terms"],
  "tone": "professional|casual|formal|medical|legal|friendly|academic|scientific|conversational|celebratory",
  "complexity": "simple|moderate|complex|expert",
  "difficultyLevel": "beginner|intermediate|advanced|expert", // For quizzes - determines question difficulty
  "essentialFields": ["basic", "required", "fields"],
  "optionalFields": ["nice-to-have", "additional", "fields"],
  "insightfulFields": ["fields", "that", "provide", "unique", "strategic", "value", "and", "enable", "deep", "analysis"],
  "strategicQuestions": ["questions", "that", "reveal", "motivations", "pain", "points", "decision", "criteria", "opportunities"],
  "decisionPoints": ["information", "that", "enables", "scoring", "segmentation", "routing", "or", "personalization"],
  "analysisNeeds": ["data", "for", "trends", "correlations", "benchmarks", "predictions"],
  "quizTopics": ["specific", "knowledge", "areas", "to", "test"], // For quizzes only
  "surveyDimensions": ["constructs", "or", "factors", "to", "measure"], // For surveys only
  "reasoning": "Detailed strategic explanation of how this design maximizes insight capture and actionable value",
  "confidence": 0.0-1.0
}

DOMAIN DETECTION GUIDE:
- healthcare/medical: Mentions of patient, doctor, medical, health, symptoms, diagnosis
- education: Mentions of student, teacher, school, course, assignment, grade, quiz, test
- business: Mentions of company, client, project, service, invoice, contract
- government: Mentions of citizen, permit, license, official, legal requirement
- finance: Mentions of payment, account, transaction, financial, budget
- legal: Mentions of contract, agreement, witness, jurisdiction, legal matter
- retail/ecommerce: Mentions of product, order, customer, purchase, shipping
- nonprofit: Mentions of donation, volunteer, cause, membership, event
- events: Mentions of party, wedding, celebration, ceremony, RSVP, invitation, gathering
- hospitality: Mentions of hotel, restaurant, reservation, guest, accommodation

FORM TYPE DETECTION (Expanded - be flexible and intelligent):
- quiz: Knowledge tests, trivia, exams, graded assessments
- registration: Creating accounts, signing up, enrollment, membership
- contact: Getting in touch, inquiries, reach out, message us
- survey: Gathering opinions, feedback, research, polls
- application: Job, program, service, scholarship applications
- booking: Reservations, appointments, scheduling, table booking
- feedback: Post-interaction reviews, ratings, testimonials
- order: Purchases, transactions, shopping, checkout
- assessment: Evaluations, screenings (can be quiz-like or survey-like)
- questionnaire: Structured data collection with specific research objectives
- rsvp: Event responses, invitation replies, attendance confirmation, party/wedding responses
- petition: Signature collection, pledges, support campaigns
- donation: Fundraising, contributions, charity, sponsorship
- consent: Agreements, waivers, permissions, GDPR consent, terms acceptance
- contest: Giveaways, competitions, sweepstakes, raffles, enter to win
- review: Product reviews, service ratings, testimonials
- volunteer: Volunteer signups, help offers, participation forms
- request: Support tickets, help desk, issue reports, service requests
- poll: Quick votes, opinion polls, preference selection`;
}

// Stage 2: Form Generation - Create form based on rich context
function buildFormGenerationPrompt(contextAnalysis: ContextAnalysis, brief: string): string {
  const isQuiz = contextAnalysis.isQuiz || contextAnalysis.formType === "quiz";
  const isSurvey = contextAnalysis.formType === "survey" || contextAnalysis.formType === "questionnaire" || contextAnalysis.formType === "feedback";
  
  return `You are a world-class form architect, psychometrician, and data strategist. Your expertise spans UX design, behavioral psychology, survey methodology, and educational assessment. Your mission is to create forms that capture TRANSFORMATIVE information - data that reveals patterns, drives decisions, and creates genuine value.

CONTEXT ANALYSIS:
- Purpose: ${contextAnalysis.purpose}
- Audience: ${contextAnalysis.audience}
- Domain: ${contextAnalysis.domain}
- Form Type: ${contextAnalysis.formType}
- Is Quiz/Test: ${isQuiz ? "YES - GENERATE CHALLENGING KNOWLEDGE ASSESSMENT" : "NO"}
- Is Survey/Questionnaire: ${isSurvey ? "YES - DESIGN FOR STATISTICAL ANALYSIS" : "NO"}
- Tone: ${contextAnalysis.tone}
- Complexity: ${contextAnalysis.complexity}
- Essential Fields: ${contextAnalysis.essentialFields.join(", ")}
- Optional Fields: ${contextAnalysis.optionalFields.join(", ")}
- Insightful Fields: ${contextAnalysis.insightfulFields?.join(", ") || "To be determined"}
- Strategic Questions: ${contextAnalysis.strategicQuestions?.join(", ") || "To be determined"}
- Decision Points: ${contextAnalysis.decisionPoints?.join(", ") || "To be determined"}
- Analysis Needs: ${contextAnalysis.analysisNeeds?.join(", ") || "To be determined"}
- Reasoning: ${contextAnalysis.reasoning}

ORIGINAL REQUEST:
"${brief}"

YOUR CRITICAL TASK:
Create a form that goes FAR BEYOND basic data collection. Every question must serve a strategic purpose:
1. **TRANSFORMATIVE INSIGHTS** - Information that changes understanding and enables breakthroughs
2. **PREDICTIVE VALUE** - Data points that indicate future behaviors, needs, or outcomes
3. **SEGMENTATION POWER** - Enable meaningful grouping for personalized experiences
4. **CORRELATION DISCOVERY** - Questions designed to reveal hidden relationships
5. **ACTIONABLE INTELLIGENCE** - Every response must inform a potential action

${isQuiz ? `
═══════════════════════════════════════════════════════════════
                    QUIZ GENERATION - EXPERT MODE
═══════════════════════════════════════════════════════════════

You are creating a PROFESSIONAL KNOWLEDGE ASSESSMENT. This must meet the standards of:
- Educational testing (SAT, GRE quality)
- Professional certification exams
- Corporate training assessments
- Academic examinations

QUIZ DESIGN REQUIREMENTS:

1. **QUESTION QUALITY STANDARDS**:
   - Each question must test SPECIFIC, VERIFIABLE KNOWLEDGE
   - Questions must be unambiguous with one clearly correct answer
   - Avoid "all of the above" and "none of the above" unless strategically valuable
   - Include questions at multiple cognitive levels (Bloom's Taxonomy):
     * 20% Knowledge/Recall: Direct factual questions
     * 30% Comprehension: Understanding concepts, explaining relationships
     * 30% Application: Using knowledge in new situations
     * 20% Analysis/Evaluation: Critical thinking, comparing, judging

2. **DISTRACTOR DESIGN**:
   - Wrong answers must be PLAUSIBLE, not obviously wrong
   - Include common misconceptions as distractors
   - Avoid patterns in correct answer positions
   - Make all options grammatically consistent with the stem

3. **QUESTION VARIETY**:
   - Mix question types: multiple choice (radio), multi-select (checkbox), short answer (text)
   - Include scenario-based questions that test application
   - Add questions that require synthesis of multiple concepts

4. **DIFFICULTY DISTRIBUTION**:
   - 25% Easy (most test-takers should answer correctly)
   - 50% Medium (discriminates between prepared and unprepared)
   - 25% Hard (challenges even well-prepared respondents)

5. **STRICT PROHIBITIONS - DO NOT GENERATE THESE**:
   ❌ "What interests you about [topic]?"
   ❌ "What challenges do you face with [topic]?"
   ❌ "How would you rate your knowledge of [topic]?"
   ❌ "Why are you taking this quiz?"
   ❌ "What do you hope to learn about [topic]?"
   ❌ "Describe your experience with [topic]"
   ❌ Any opinion-based or self-reflection questions
   ❌ Any meta-questions about the quiz itself

6. **REQUIRED QUIZ CONFIG** for each question:
   {
     "quizConfig": {
       "correctAnswer": "Exact matching option text OR array for checkbox",
       "points": 1-10 based on difficulty,
       "explanation": "Detailed explanation of why this is correct and why other options are wrong"
     }
   }

` : ''}

${isSurvey ? `
═══════════════════════════════════════════════════════════════
              SURVEY/QUESTIONNAIRE - RESEARCH GRADE
═══════════════════════════════════════════════════════════════

You are designing a SCIENTIFICALLY RIGOROUS survey instrument. Apply these principles:

1. **MEASUREMENT SCIENCE**:
   - Use validated scales where applicable (Likert, semantic differential, NPS)
   - Ensure each question measures ONE construct clearly
   - Include both positively and negatively worded items to detect response bias
   - Design for reliable statistical analysis

2. **QUESTION QUALITY**:
   - Avoid double-barreled questions (asking two things at once)
   - Use neutral, non-leading language
   - Provide exhaustive and mutually exclusive response options
   - Include "Not Applicable" or "Prefer not to say" where appropriate

3. **INSIGHT-GENERATING QUESTIONS**:
   - Ask about BEHAVIORS, not just attitudes (behaviors predict better)
   - Include temporal dimensions: frequency, recency, duration
   - Use comparative questions: "Compared to X, how do you rate Y?"
   - Ask about specific instances: "Think about your last experience..."

4. **ADVANCED SURVEY TECHNIQUES**:
   - Include anchor questions for response validation
   - Use skip logic to reduce respondent burden
   - Balance positive and negative scale endpoints
   - Consider question order effects

5. **HIGH-VALUE QUESTION TYPES**:
   - Net Promoter Score (NPS): "How likely are you to recommend...?" (0-10)
   - Satisfaction: "How satisfied are you with...?" (5-point or 7-point)
   - Importance-Performance: Rate importance AND satisfaction
   - Open-ended strategically: "What ONE thing would you change?"
   - Ranking: "Rank these factors by importance"
   - MaxDiff: "Most/Least important from this set"

6. **ANALYTICAL VALUE**:
   - Design questions that enable cross-tabulation
   - Include demographic segmentation variables
   - Add questions that test hypotheses
   - Create opportunity for correlation analysis

` : ''}

FIELD TYPE SELECTION INTELLIGENCE:
- "email" → Email addresses (automatic validation)
- "tel" → Phone numbers (with format validation pattern)
- "url" → Website/link inputs
- "number" → Numeric values (age, quantity, price, rating)
- "date" → Date selections (with context-appropriate min/max)
- "textarea" → Long text (comments, descriptions, addresses, messages)
- "text" → Short text (names, titles, single-line inputs)
- "select" → Single choice from many options (4+ options, or long option names)
- "radio" → Single choice from few options (2-4 options, short names)
- "checkbox" → Multiple selections OR single yes/no agreements

JSON STRUCTURE:
{
  "title": "Clear, descriptive form title that reflects purpose and domain",
  "quizMode": { // ONLY if this is a quiz
    "enabled": true,
    "showScoreImmediately": true,
    "showCorrectAnswers": true,
    "showExplanations": true,
    "passingScore": 70
  },
  "fields": [
    {
      "id": "semantic_snake_case_id",
      "label": "User-friendly label with proper capitalization and domain-appropriate language",
      "type": "text|email|textarea|number|date|select|radio|checkbox|tel|url",
      "required": true|false,
      "placeholder": "Helpful, contextual placeholder text",
      "helpText": "Additional guidance explaining WHY this field provides value, what insights it captures, and how the data will be used",
      "options": ["option1", "option2"], // Only for select/radio/checkbox types - make these insightful and meaningful
      "validation": {
        "min": number,  // For number/date types
        "max": number,
        "pattern": "regex", // For text/tel types
        "minLength": number, // For text/textarea
        "maxLength": number
      },
      "reasoning": "Explanation of the STRATEGIC VALUE and INSIGHTS this field provides",
      ${isQuiz ? `
      "quizConfig": {
        "correctAnswer": "Exact value of option matching the correct answer", // For checkbox, use array of strings
        "points": 1, // Default 1
        "explanation": "Why this is the correct answer"
      }
      ` : ""}
    }
  ]
}

${isQuiz ? `
QUIZ FIELD EXAMPLES:
{
  "label": "What is the capital of France?",
  "type": "radio",
  "options": ["London", "Berlin", "Paris", "Madrid"],
  "quizConfig": {
    "correctAnswer": "Paris",
    "points": 1,
    "explanation": "Paris is the capital and most populous city of France."
  }
}
` : `
FIELD TYPE SELECTION INTELLIGENCE:
- "email" → Email addresses (includes validation)
- "tel" → Phone numbers
- "url" → Website/link inputs
- "number" → Numeric values (age, quantity, price)
- "date" → Date selections
- "textarea" → Long text (comments, descriptions, addresses)
- "text" → Short text (names, titles, single-line inputs)
- "select" → Single choice from many options (4+ options, or long option names)
- "radio" → Single choice from few options (2-4 options, short names)
- "checkbox" → Multiple selections OR single yes/no agreements
`}

DOMAIN-SPECIFIC FIELD PATTERNS:

**Healthcare/Medical:**
- Patient identification (name, DOB, ID number)
- Medical history sections with privacy considerations
- Insurance information
- Emergency contact
- HIPAA/consent acknowledgments
- Symptom descriptions (textarea)

**Education:**
- Student/applicant identification
- Academic background (degree, GPA, institution)
- Program/course selection (select)
- Transcript/document upload mentions
- Previous experience (textarea)

**Business:**
- Company/organization information
- Professional title and experience
- Project/department selection
- Budget/financial information (number with currency)
- Business goals/objectives (textarea)

**Government:**
- Official identification fields
- Residency/citizenship status
- Permit/license numbers
- Legal acknowledgments
- Formal language throughout

**Finance:**
- Account/identification numbers
- Financial information with security in mind
- Amount fields with currency formatting
- Security questions
- Precise financial terminology

**Legal:**
- Party identification
- Case/matter references
- Jurisdiction selections
- Signature and witness fields
- Precise legal terminology

**Retail/Ecommerce:**
- Customer information
- Product/order details
- Quantity and pricing
- Shipping/billing addresses
- Shopping-friendly terminology

VALIDATION INTELLIGENCE:
- Phone: Include pattern like "^[+]?[(]?[0-9]{3}[)]?[-\\s.]?[0-9]{3}[-\\s.]?[0-9]{4,6}$"
- Email: Automatically validated by type
- Password: minLength: 8 (if password field exists)
- Age: min: 13 (for general forms), min: 18 (for adult services), max: 120
- Dates: Set reasonable min/max based on context (e.g., birthdate: max = today, event date: min = today)
- Text fields: Set maxLength: 255 for names, 5000 for textarea
- Numbers: Set min: 0 for quantities, appropriate min/max for ratings

INSIGHTFUL FIELD EXAMPLES:

For Contact Forms:
- "What prompted you to reach out today?" (select: reveals urgency and intent)
- "What's your primary goal?" (select: enables targeted follow-up)
- "How did you hear about us?" (select: enables channel analysis)
- "What industry are you in?" (select: enables segmentation)

For Job Applications:
- "What attracts you most to this role?" (textarea: reveals fit and motivations)
- "What unique value would you bring?" (textarea: differentiates candidates)
- "What are your career goals?" (textarea: shows long-term alignment)
- "Current salary range" (select: enables budget planning)

For Feedback Forms:
- "What specific aspect mattered most?" (select: identifies key drivers)
- "What would improve your experience?" (textarea: actionable insights)
- "How likely are you to recommend us?" (number/select: NPS calculation)
- "What's your relationship with us?" (select: new customer, repeat, VIP - enables segmentation)

For Registration:
- "What are you hoping to achieve?" (select: enables personalized onboarding)
- "What interests you most?" (multi-select: enables content personalization)
- "What's your primary role?" (select: enables community segmentation)
- "Company size" (select: enables B2B segmentation)

For Surveys:
- "What's your biggest challenge?" (textarea: identifies pain points)
- "What would make the biggest difference?" (textarea: reveals priorities)
- "How often do you...?" (select: enables usage segmentation)
- "What factors matter most to you?" (multi-select: reveals priorities)

CRITICAL REMINDER:
- Every field should have a CLEAR PURPOSE beyond basic data collection
- Prioritize fields that provide ACTIONABLE INSIGHTS over nice-to-have information
- Think: "What would make this data truly valuable and insightful?"
- Include fields that enable segmentation, personalization, and analysis
- Make helpText explain the STRATEGIC VALUE of each field

Remember: Create forms that capture MEANINGFUL, INSIGHTFUL, ACTIONABLE information that enables better decisions and deeper understanding.`;
}

function buildContextAnalysisUserPrompt(brief: string): string {
  return `Analyze this form request with a focus on STRATEGIC VALUE and MEANINGFUL INSIGHTS:

"${brief}"

Perform a comprehensive strategic analysis:

BASIC UNDERSTANDING:
1. What is the underlying PURPOSE? What is the user trying to accomplish?
2. Who is the TARGET AUDIENCE? What are their characteristics, needs, and behaviors?
3. What DOMAIN does this belong to? (Healthcare, Education, Business, etc.)
4. What FORM TYPE is this? (Registration, Contact, Survey, Application, etc.)
5. What is the TONE? (Professional, Casual, Medical, Legal, etc.)
6. What KEY ENTITIES are mentioned or implied?
7. What is the COMPLEXITY level?

STRATEGIC THINKING - MOST VALUABLE INFORMATION:
8. What ESSENTIAL fields are required? (Basic requirements - name, email, etc.)
9. What INSIGHTFUL fields would provide the most value? (Think: motivations, preferences, context, pain points, goals)
10. What STRATEGIC QUESTIONS would reveal deeper understanding? (Why they're here, what they need, what challenges them)
11. What DECISION POINTS need information? (What data would help make better decisions or take better actions?)
12. What ANALYSIS NEEDS exist? (What data points would enable segmentation, trend analysis, pattern recognition, personalization?)

EXAMPLES OF INSIGHTFUL THINKING:

For "contact form":
- Basic: name, email, message
- Insightful: What prompted you to reach out? (select: product question, support issue, partnership inquiry)
- Strategic: What's your primary goal? (select: learn more, solve problem, make purchase)
- Analysis: How did you hear about us? (enables channel analysis)

For "job application":
- Basic: name, email, resume
- Insightful: What attracts you to this role? (textarea: reveals motivations and fit)
- Strategic: What unique value would you bring? (textarea: differentiates candidates)
- Analysis: Years of experience, salary expectations (enables candidate segmentation)

For "customer feedback":
- Basic: rating, comments
- Insightful: What specific aspect mattered most? (select: quality, price, service, delivery)
- Strategic: What would improve your experience? (textarea: actionable insights)
- Analysis: How likely are you to recommend? (NPS calculation), Customer segment (select: new, repeat, VIP)

For "registration form":
- Basic: name, email, password
- Insightful: What are you hoping to achieve? (select: learn, network, find opportunities)
- Strategic: What interests you most? (multi-select: enables personalized content)
- Analysis: Industry, company size, role level (enables user segmentation)

Think like a data strategist who wants to understand users deeply, make better decisions, and extract maximum value from every response. Focus on fields that provide ACTIONABLE INSIGHTS, not just data collection.`;
}

export async function POST(req: Request) {
  try {
    const { brief } = await req.json();
    if (typeof brief !== "string" || !brief.trim()) {
      return NextResponse.json({ error: "Invalid brief" }, { status: 400 });
    }

    // Stage 1: Deep Context Analysis - Understand intent and meaning
    console.log("Stage 1: Analyzing context and intent...");
    const contextAnalysisResponse = await getAICompletion({
      messages: [
        {
          role: "system",
          content: buildContextAnalysisPrompt(),
        },
        {
          role: "user",
          content: buildContextAnalysisUserPrompt(brief),
        },
      ],
      temperature: 0.4, // Slightly higher for richer analysis
      maxTokens: 2000,
      responseFormat: "json",
    });

    const contextContent = contextAnalysisResponse.content || "{}";
    console.log(`Context analysis using ${contextAnalysisResponse.provider} AI provider`);
    
    let contextAnalysis: ContextAnalysis;
    try {
      contextAnalysis = JSON.parse(contextContent) as ContextAnalysis;
      
      // Normalize and validate context analysis
      contextAnalysis = {
        purpose: contextAnalysis.purpose || "Form data collection",
        audience: contextAnalysis.audience || "General users",
        domain: contextAnalysis.domain || "general",
        formType: contextAnalysis.formType || "general",
        isQuiz: contextAnalysis.isQuiz || contextAnalysis.formType === "quiz" || contextAnalysis.formType === "assessment",
        keyEntities: Array.isArray(contextAnalysis.keyEntities) ? contextAnalysis.keyEntities : [],
        tone: contextAnalysis.tone || "professional",
        complexity: contextAnalysis.complexity || "moderate",
        essentialFields: Array.isArray(contextAnalysis.essentialFields) ? contextAnalysis.essentialFields : [],
        optionalFields: Array.isArray(contextAnalysis.optionalFields) ? contextAnalysis.optionalFields : [],
        insightfulFields: Array.isArray(contextAnalysis.insightfulFields) ? contextAnalysis.insightfulFields : [],
        strategicQuestions: Array.isArray(contextAnalysis.strategicQuestions) ? contextAnalysis.strategicQuestions : [],
        decisionPoints: Array.isArray(contextAnalysis.decisionPoints) ? contextAnalysis.decisionPoints : [],
        analysisNeeds: Array.isArray(contextAnalysis.analysisNeeds) ? contextAnalysis.analysisNeeds : [],
        reasoning: contextAnalysis.reasoning || "Strategic form fields focused on meaningful insights",
        confidence: typeof contextAnalysis.confidence === "number" ? contextAnalysis.confidence : 0.7,
      };
    } catch (parseError) {
      console.error("Context analysis parsing error:", parseError);
      // Fallback to basic context
      contextAnalysis = {
        purpose: "Form data collection",
        audience: "General users",
        domain: "general",
        formType: "general",
        isQuiz: false,
        keyEntities: [],
        tone: "professional",
        complexity: "moderate",
        essentialFields: [],
        optionalFields: [],
        insightfulFields: [],
        strategicQuestions: [],
        decisionPoints: [],
        analysisNeeds: [],
        reasoning: "Basic form generation",
        confidence: 0.5,
      };
    }

    console.log("Context analysis complete:", {
      domain: contextAnalysis.domain,
      formType: contextAnalysis.formType,
      complexity: contextAnalysis.complexity,
      confidence: contextAnalysis.confidence,
    });

    // Stage 2: Generate Form Based on Rich Context
    console.log("Stage 2: Generating form with context-aware intelligence...");
    const formGenerationResponse = await getAICompletion({
      messages: [
        {
          role: "system",
          content: buildFormGenerationPrompt(contextAnalysis, brief),
        },
        {
          role: "user",
          content: `Generate a form that captures the MOST MEANINGFUL and INSIGHTFUL information. 

Focus on:
- Domain: ${contextAnalysis.domain}
- Form Type: ${contextAnalysis.formType}
- Tone: ${contextAnalysis.tone}
- Essential Fields: ${contextAnalysis.essentialFields.join(", ")}
- Insightful Fields: ${contextAnalysis.insightfulFields.join(", ")}
- Strategic Questions: ${contextAnalysis.strategicQuestions.join(", ")}
- Decision Points: ${contextAnalysis.decisionPoints.join(", ")}
- Analysis Needs: ${contextAnalysis.analysisNeeds.join(", ")}

PRIORITIZE fields that provide ACTIONABLE INSIGHTS and STRATEGIC VALUE. Every field should have a clear purpose beyond basic data collection. Include fields that enable segmentation, personalization, trend analysis, and better decision-making.`,
        },
      ],
      temperature: 0.3, // Lower for consistent structure
      maxTokens: 3500,
      responseFormat: "json",
    });

    const formContent = formGenerationResponse.content || "{}";
    console.log(`Form generated using ${formGenerationResponse.provider} AI provider`);
    const formData = JSON.parse(formContent) as { title: string; fields: Field[]; quizMode?: any };
    
    // Validate response structure
    if (!formData?.title || !Array.isArray(formData.fields) || formData.fields.length === 0) {
      return NextResponse.json({ error: "AI generated invalid form structure" }, { status: 502 });
    }

    // Post-process fields to ensure quality and add context
    const processedFields = formData.fields.map((field, index) => {
      const processedField: Field = {
        ...field,
        id: field.id || `field_${index}`,
        label: field.label || "Field",
        type: field.type || "text",
        required: field.required ?? false,
        placeholder: field.placeholder,
        helpText: field.helpText,
        // Ensure options exist for choice fields
        options: (field.type === "select" || field.type === "radio" || field.type === "checkbox") 
          ? (field.options && field.options.length > 0 ? field.options : undefined)
          : undefined,
        validation: field.validation,
        reasoning: field.reasoning,
        // Normalize quizConfig - ensure points defaults to 1
        quizConfig: field.quizConfig ? {
          correctAnswer: field.quizConfig.correctAnswer || '',
          points: field.quizConfig.points || 1, // Default to 1 point
          explanation: field.quizConfig.explanation || ''
        } : undefined,
      };

      // Add contextual helpText if missing for complex fields
      if (!processedField.helpText && contextAnalysis.complexity === "complex") {
        processedField.helpText = `Please provide ${processedField.label.toLowerCase()} for ${contextAnalysis.purpose.toLowerCase()}`;
      }

      return processedField;
    });

    // Detect if this is a quiz and auto-enable quiz mode
    const hasQuizConfig = processedFields.some(f => f.quizConfig);
    const isQuiz = contextAnalysis.isQuiz || hasQuizConfig || formData.quizMode?.enabled;
    
    // Build quiz mode configuration - auto-enable if quiz detected
    const quizMode = isQuiz ? (formData.quizMode || {
      enabled: true,
      showScoreImmediately: true,
      showCorrectAnswers: true,
      showExplanations: true,
      passingScore: 70
    }) : undefined;

    // Return form with rich context metadata
    return NextResponse.json({
      title: formData.title,
      fields: processedFields,
      ...(quizMode ? { quizMode } : {}), // Only include quizMode if it's a quiz
      context: {
        analysis: contextAnalysis,
        summary: `${contextAnalysis.purpose}. For ${contextAnalysis.audience} in the ${contextAnalysis.domain} domain.`,
      },
    });
  } catch (err) {
    const error = err as Error;
    console.error("Form generation error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate form" },
      { status: 500 }
    );
  }
}


