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
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
};

// Enhanced prompt engineering for intelligent form generation
function buildSystemPrompt(): string {
  return `You are an expert form designer with deep understanding of UX best practices, accessibility, and data collection. Your task is to create intelligent, user-friendly forms.

CRITICAL RULES:
1. Analyze the user's request deeply - understand the PURPOSE, CONTEXT, and TARGET AUDIENCE
2. Return ONLY valid JSON with no additional text or markdown
3. Think through the complete user journey and data requirements
4. Apply industry best practices for the form type (e.g., registration, survey, application)

JSON STRUCTURE:
{
  "title": "Clear, descriptive form title",
  "fields": [
    {
      "id": "semantic_snake_case_id",
      "label": "User-friendly label with proper capitalization",
      "type": "text|email|textarea|number|date|select|radio|checkbox|tel|url",
      "required": true|false,
      "placeholder": "Helpful placeholder text (optional)",
      "options": ["option1", "option2"] // Only for select/radio/checkbox types,
      "validation": {
        "min": number,  // For number/date types
        "max": number,
        "pattern": "regex", // For text/tel types
        "minLength": number, // For text/textarea
        "maxLength": number
      }
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

SMART FORM DESIGN PRINCIPLES:
1. **Order fields logically**: Personal info → Contact → Specifics → Optional fields
2. **Group related fields**: First name + Last name, Address fields together
3. **Smart required fields**: Critical data is required, nice-to-have is optional
4. **Appropriate field types**: Use specialized types (email, tel, url) for better UX
5. **Helpful placeholders**: Provide examples without stating the obvious
6. **Realistic options**: For select/radio, provide 3-8 relevant, realistic options
7. **Validation rules**: Add sensible constraints (min/max, patterns) when appropriate
8. **Clear labels**: Use natural language, avoid jargon, be concise
9. **Accessibility**: Labels should be self-explanatory without needing placeholder

CONTEXT-AWARE INTELLIGENCE:
- **Registration forms**: Include email, password, agree-to-terms checkbox
- **Contact forms**: Name, email, subject/reason, message (textarea)
- **Surveys**: Mix of question types, optional fields for feedback
- **Applications**: Comprehensive fields, file upload needs, multiple steps
- **Booking/RSVP**: Date/time, number of attendees, special requirements
- **Feedback**: Rating (number/select), satisfaction (radio), comments (textarea)

VALIDATION INTELLIGENCE:
- Phone: Include pattern for format validation
- Email: Automatically validated by type
- Password: minLength: 8 or more
- Age: min: 18 (or appropriate), max: 120
- Dates: Set reasonable min/max based on context
- Text fields: Set maxLength to prevent abuse

EXAMPLES OF SMART ANALYSIS:

Input: "registration form"
Analysis: User needs account creation → email (required), password (required, min 8), confirm password, username/name (required), agree to terms (checkbox, required)

Input: "customer feedback"
Analysis: Post-purchase survey → name (optional), email (optional), satisfaction rating (radio 1-5), product quality (radio), recommend to friend (radio yes/no), additional comments (textarea, optional)

Input: "job application"
Analysis: Professional application → full name (required), email (required), phone (required), current position, years of experience (number), resume upload note, cover letter (textarea), availability date, salary expectation (optional)

Remember: The goal is to create forms that are INTUITIVE, COMPLETE, and PROFESSIONAL with minimal user editing required.`;
}

function buildUserPrompt(brief: string): string {
  return `Analyze this form request and create a professional, comprehensive form:

"${brief}"

Think through:
1. What is the PRIMARY PURPOSE of this form?
2. Who is the TARGET AUDIENCE?
3. What ESSENTIAL information must be collected?
4. What OPTIONAL information would be valuable?
5. What is the best FIELD ORDER for user experience?
6. What VALIDATION rules make sense?

Now generate the complete form JSON with intelligent field selection, proper validation, helpful placeholders, and logical ordering.`;
}

export async function POST(req: Request) {
  try {
    const { brief } = await req.json();
    if (typeof brief !== "string" || !brief.trim()) {
      return NextResponse.json({ error: "Invalid brief" }, { status: 400 });
    }

    // Use multi-provider AI system (Cohere prioritized for structured JSON generation)
    // Falls back to Gemini, Together, or Groq if Cohere is unavailable
    const aiResponse = await getAICompletion({
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(),
        },
        {
          role: "user",
          content: buildUserPrompt(brief),
        },
      ],
      temperature: 0.3, // Slightly higher for creativity while maintaining consistency
      maxTokens: 3000,
      responseFormat: "json", // Request JSON format for structured form data
    });

    const content = aiResponse.content || "{}";
    console.log(`Form generated using ${aiResponse.provider} AI provider`);
    const data = JSON.parse(content) as { title: string; fields: Field[] };
    
    // Validate response structure
    if (!data?.title || !Array.isArray(data.fields) || data.fields.length === 0) {
      return NextResponse.json({ error: "AI generated invalid form structure" }, { status: 502 });
    }

    // Post-process fields to ensure quality
    const processedFields = data.fields.map((field, index) => ({
      ...field,
      id: field.id || `field_${index}`,
      label: field.label || "Field",
      type: field.type || "text",
      required: field.required ?? false,
      // Ensure options exist for choice fields
      options: (field.type === "select" || field.type === "radio") 
        ? (field.options || ["Option 1", "Option 2", "Option 3"]) 
        : undefined,
    }));

    return NextResponse.json({
      title: data.title,
      fields: processedFields,
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


