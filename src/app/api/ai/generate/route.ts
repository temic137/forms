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
};

type ContextAnalysis = {
  purpose: string;
  audience: string;
  domain: string;
  formType: string;
  keyEntities: string[];
  tone: string;
  complexity: "simple" | "moderate" | "complex";
  essentialFields: string[];
  optionalFields: string[];
  insightfulFields: string[]; // Fields that provide unique value and insights
  strategicQuestions: string[]; // Questions that reveal deeper understanding
  decisionPoints: string[]; // Information needed for decision-making
  analysisNeeds: string[]; // Data points that enable meaningful analysis
  reasoning: string;
  confidence: number;
};

// Stage 1: Context Analysis - Deep understanding of intent and meaning
function buildContextAnalysisPrompt(): string {
  return `You are an expert strategic analyst specializing in identifying the MOST VALUABLE and INSIGHTFUL information. Your task is to deeply analyze form requests to determine what information would provide the greatest strategic value, actionable insights, and meaningful understanding.

CRITICAL ANALYSIS PRINCIPLES:
1. **Strategic Value First**: Focus on information that provides ACTIONABLE INSIGHTS, not just basic data collection
2. **Depth Over Breadth**: Prioritize meaningful questions that reveal deeper understanding over surface-level requirements
3. **Decision-Making Focus**: Identify what information would help make better decisions or understand patterns
4. **Analysis Enabling**: Determine data points that enable meaningful analysis, segmentation, and insights
5. **Context Detection**: Identify domain (healthcare, business, education, etc.) and form type
6. **Audience Awareness**: Determine who will fill out this form and what would be most valuable to know about them
7. **Tone Recognition**: Understand the communication style (professional, casual, medical, legal, etc.)
8. **Insightful Questioning**: Think beyond "what is required" to "what would be most insightful to know"

KEY THINKING FRAMEWORK:
- **Basic Fields**: What is minimally required (name, email, etc.) - INCLUDE but don't stop here
- **Meaningful Fields**: What provides context, understanding, or actionable data - PRIORITIZE these
- **Strategic Questions**: What would reveal motivations, preferences, pain points, or opportunities
- **Decision Enablers**: What information would help make better decisions or improve outcomes
- **Analysis Drivers**: What data points would enable segmentation, trend analysis, or pattern recognition

Return ONLY valid JSON with this structure:
{
  "purpose": "Clear explanation of what this form accomplishes and what insights it should provide",
  "audience": "Who will use this form (customers, employees, patients, students, etc.)",
  "domain": "healthcare|education|business|government|finance|legal|retail|ecommerce|nonprofit|general",
  "formType": "registration|contact|survey|application|booking|feedback|order|assessment|other",
  "keyEntities": ["important", "concepts", "mentioned", "or", "implied"],
  "tone": "professional|casual|formal|medical|legal|friendly|academic",
  "complexity": "simple|moderate|complex",
  "essentialFields": ["basic", "required", "fields"],
  "optionalFields": ["nice-to-have", "additional", "fields"],
  "insightfulFields": ["fields", "that", "provide", "unique", "value", "and", "deep", "insights"],
  "strategicQuestions": ["questions", "that", "reveal", "motivations", "preferences", "pain", "points"],
  "decisionPoints": ["information", "needed", "for", "decision-making", "or", "action"],
  "analysisNeeds": ["data", "points", "that", "enable", "analysis", "segmentation", "trends"],
  "reasoning": "Detailed explanation of why these fields provide strategic value and meaningful insights",
  "confidence": 0.0-1.0
}

DOMAIN DETECTION GUIDE:
- healthcare/medical: Mentions of patient, doctor, medical, health, symptoms, diagnosis
- education: Mentions of student, teacher, school, course, assignment, grade
- business: Mentions of company, client, project, service, invoice, contract
- government: Mentions of citizen, permit, license, official, legal requirement
- finance: Mentions of payment, account, transaction, financial, budget
- legal: Mentions of contract, agreement, witness, jurisdiction, legal matter
- retail/ecommerce: Mentions of product, order, customer, purchase, shipping
- nonprofit: Mentions of donation, volunteer, cause, membership, event

FORM TYPE DETECTION:
- registration: Creating accounts, signing up
- contact: Getting in touch, inquiries
- survey: Gathering opinions, feedback, research
- application: Job, program, service applications
- booking: Reservations, appointments, scheduling
- feedback: Post-interaction reviews, ratings
- order: Purchases, transactions
- assessment: Evaluations, tests, screenings`;
}

// Stage 2: Form Generation - Create form based on rich context
function buildFormGenerationPrompt(contextAnalysis: ContextAnalysis, brief: string): string {
  return `You are an expert form designer and data strategist with deep understanding of UX best practices, accessibility, and INSIGHTFUL data collection. Your goal is to create a form that captures the MOST MEANINGFUL and ACTIONABLE information.

CONTEXT ANALYSIS:
- Purpose: ${contextAnalysis.purpose}
- Audience: ${contextAnalysis.audience}
- Domain: ${contextAnalysis.domain}
- Form Type: ${contextAnalysis.formType}
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
Generate a form that captures the MOST MEANINGFUL and INSIGHTFUL information. This is NOT just about collecting required fields - it's about gathering data that provides:
1. **ACTIONABLE INSIGHTS** - Information that enables better decisions and actions
2. **STRATEGIC VALUE** - Data points that reveal motivations, preferences, pain points, opportunities
3. **ANALYSIS CAPABILITY** - Fields that enable segmentation, trend analysis, and pattern recognition
4. **DEEPER UNDERSTANDING** - Questions that go beyond surface-level to reveal what truly matters

FORM GENERATION PRIORITIES:
1. **Include Essential Fields** - Basic requirements (name, email, etc.) - but don't stop here
2. **PRIORITIZE Insightful Fields** - Focus heavily on fields that provide unique value and deep insights
3. **Add Strategic Questions** - Include questions that reveal motivations, goals, challenges, preferences
4. **Enable Decision-Making** - Include data points needed for better decisions or actions
5. **Support Analysis** - Add fields that enable segmentation, personalization, and trend analysis
6. **Reflect domain and tone** - Use appropriate terminology and structure
7. **Order strategically** - Start with essential, progress to insightful, end with analysis-enabling
8. **Provide rich context** - Add helpText that explains WHY each field matters and what insights it provides

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
      "reasoning": "Explanation of the STRATEGIC VALUE and INSIGHTS this field provides - why it's meaningful, what it reveals, how it enables better decisions or analysis"
    }
  ]
}

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
    const formData = JSON.parse(formContent) as { title: string; fields: Field[] };
    
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
      };

      // Add contextual helpText if missing for complex fields
      if (!processedField.helpText && contextAnalysis.complexity === "complex") {
        processedField.helpText = `Please provide ${processedField.label.toLowerCase()} for ${contextAnalysis.purpose.toLowerCase()}`;
      }

      return processedField;
    });

    // Return form with rich context metadata
    return NextResponse.json({
      title: formData.title,
      fields: processedFields,
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


