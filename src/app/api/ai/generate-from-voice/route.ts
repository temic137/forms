import { NextResponse } from "next/server";
import { getGroqClient } from "@/lib/groq";
import type { Field } from "@/types/form";
import { enhanceTranscriptForAI } from "@/lib/transcriptProcessor";

export const runtime = "nodejs";

interface VoiceGenerationRequest {
  transcript: string;
  language?: string;
}

interface VoiceGenerationResponse {
  form: {
    title: string;
    fields: Field[];
  };
  confidence: number;
}

/**
 * POST /api/ai/generate-from-voice
 * 
 * Generates form configuration from voice transcription text.
 * 
 * PRIVACY & SECURITY (Requirement 9.3):
 * - This endpoint ONLY accepts text transcriptions, NOT audio data
 * - Speech-to-text conversion happens in the browser using Web Speech API
 * - No audio is ever transmitted to the server
 * - Only the resulting text transcription is sent for AI processing
 */
export async function POST(req: Request) {
  try {
    const { transcript, language = "en-US" } = (await req.json()) as VoiceGenerationRequest;

    // Validate that we only receive text data (Requirement 9.3)
    if (typeof transcript !== "string" || !transcript.trim()) {
      return NextResponse.json(
        { error: "Invalid transcript" },
        { status: 400 }
      );
    }

    // IMPROVED: Enhance transcript with context before sending to AI
    const enhancedTranscript = enhanceTranscriptForAI(transcript);
    console.log('Original transcript:', transcript);
    console.log('Enhanced transcript:', enhancedTranscript);

    const groq = getGroqClient();

    // Build language-aware system prompt
    const languageContext = getLanguageContext(language);
    
    const resp = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an expert form generation assistant with deep understanding of voice transcriptions. 
Your goal is to create the most accurate, user-friendly forms from voice input.

${languageContext}

IMPORTANT UNDERSTANDING RULES:
1. Interpret natural language patterns:
   - "I need" / "I want" / "Create" → These are intent markers, not field names
   - "with X, Y, and Z" → These are the fields to include
   - "for X" or "to do X" → This describes the form's purpose (use for title)
   
2. Smart field type inference:
   - Words like "email", "e-mail" → email type
   - "message", "comment", "feedback", "description" → textarea
   - "phone", "telephone", "mobile" → text type with phone validation
   - "date", "birthday", "when" → date type
   - "file", "upload", "attach", "document" → file type
   - "choose", "select from", "pick" → select type
   - "yes/no", "agree", "consent" → checkbox
   - Numbers, quantity, amount → number type
   
3. Context awareness:
   - Contact forms typically need: name, email, message
   - Registration forms typically need: name, email, password
   - Survey forms may need: multiple choice questions
   - Feedback forms typically need: rating, comments
   
4. Handle ambiguity intelligently:
   - If unclear, default to text type
   - Add helpful helpText when field purpose might be ambiguous
   - Set reasonable defaults for required fields

EXAMPLES:

Example 1:
Input: "create a contact form with name email and message"
Output: {
  "title": "Contact Form",
  "fields": [
    {
      "id": "name",
      "label": "Name",
      "type": "text",
      "required": true,
      "placeholder": "Enter your full name",
      "order": 0
    },
    {
      "id": "email",
      "label": "Email",
      "type": "email",
      "required": true,
      "placeholder": "your.email@example.com",
      "order": 1
    },
    {
      "id": "message",
      "label": "Message",
      "type": "textarea",
      "required": true,
      "placeholder": "Type your message here...",
      "order": 2
    }
  ],
  "confidence": 0.95
}

Example 2:
Input: "I need a registration form for name phone number and company"
Output: {
  "title": "Registration Form",
  "fields": [
    {
      "id": "name",
      "label": "Full Name",
      "type": "text",
      "required": true,
      "placeholder": "John Doe",
      "order": 0
    },
    {
      "id": "phone",
      "label": "Phone Number",
      "type": "text",
      "required": true,
      "placeholder": "(555) 123-4567",
      "helpText": "We'll use this to contact you",
      "order": 1
    },
    {
      "id": "company",
      "label": "Company",
      "type": "text",
      "required": false,
      "placeholder": "Your company name",
      "order": 2
    }
  ],
  "confidence": 0.92
}

Example 3:
Input: "feedback form with rating and comments"
Output: {
  "title": "Feedback Form",
  "fields": [
    {
      "id": "rating",
      "label": "How would you rate your experience?",
      "type": "select",
      "required": true,
      "options": ["Excellent", "Good", "Average", "Poor", "Very Poor"],
      "order": 0
    },
    {
      "id": "comments",
      "label": "Additional Comments",
      "type": "textarea",
      "required": false,
      "placeholder": "Tell us more about your experience...",
      "order": 1
    }
  ],
  "confidence": 0.90
}

OUTPUT FORMAT:
Return only valid JSON matching this structure:
{
  "title": "Form Title",
  "fields": [
    {
      "id": "field_id",
      "label": "Field Label",
      "type": "text|email|textarea|number|date|select|radio|checkbox|file",
      "required": true|false,
      "placeholder": "optional placeholder text",
      "helpText": "optional help text",
      "options": ["option1", "option2"],
      "order": 0
    }
  ],
  "confidence": 0.0-1.0
}

CONFIDENCE SCORING:
- 0.9-1.0: Clear, unambiguous transcript with standard form patterns
- 0.7-0.89: Good transcript with minor ambiguity
- 0.5-0.69: Unclear transcript, made reasonable assumptions
- Below 0.5: Very unclear, minimal information`,
        },
        {
          role: "user",
          content: `Create a form based on this voice transcription: "${enhancedTranscript}"
          
Analyze the transcript carefully. Extract the form purpose, identify all requested fields, infer appropriate field types, and generate a complete, user-friendly form configuration.`,
        },
      ],
    });

    const content = resp.choices[0]?.message?.content ?? "{}";
    console.log("AI Response:", content);
    
    const data: unknown = JSON.parse(content);

    // Handle different possible response structures
    // Sometimes AI returns { form: {...}, confidence: ... }
    // Sometimes it returns { title: ..., fields: ..., confidence: ... }
    let formData: { title: string; fields: Field[] };
    let confidence: number;

    // Type guard interfaces
    interface ResponseWithForm {
      form: { title: string; fields: Field[] };
      confidence?: number;
    }
    interface ResponseDirect {
      title: string;
      fields: Field[];
      confidence?: number;
    }

    if (
      typeof data === "object" &&
      data !== null &&
      "form" in data &&
      typeof (data as ResponseWithForm).form === "object" &&
      (data as ResponseWithForm).form !== null &&
      "title" in (data as ResponseWithForm).form &&
      "fields" in (data as ResponseWithForm).form &&
      Array.isArray((data as ResponseWithForm).form.fields)
    ) {
      // Expected structure: { form: { title, fields }, confidence }
      const typed = data as ResponseWithForm;
      formData = typed.form;
      confidence = typeof typed.confidence === "number" ? typed.confidence : 0.8;
    } else if (
      typeof data === "object" &&
      data !== null &&
      "title" in data &&
      "fields" in data &&
      Array.isArray((data as ResponseDirect).fields)
    ) {
      // Alternative structure: { title, fields, confidence }
      const typed = data as ResponseDirect;
      formData = { title: typed.title, fields: typed.fields };
      confidence = typeof typed.confidence === "number" ? typed.confidence : 0.8;
    } else {
      console.error("Invalid AI response structure:", JSON.stringify(data, null, 2));
      return NextResponse.json(
        { error: "Invalid AI response structure. AI did not return a valid form configuration." },
        { status: 502 }
      );
    }

    // Validate and normalize confidence score
    confidence = Math.max(0, Math.min(1, confidence));

    // Ensure all fields have required properties
    const normalizedFields = formData.fields.map((field, index) => ({
      id: field.id || `field_${index}`,
      label: field.label || `Field ${index + 1}`,
      type: field.type || "text",
      required: field.required ?? false,
      placeholder: field.placeholder,
      helpText: field.helpText,
      options: field.options,
      order: field.order ?? index,
    }));

    return NextResponse.json({
      form: {
        title: formData.title,
        fields: normalizedFields,
      },
      confidence,
    });
  } catch (err) {
    console.error("Voice form generation error:", err);
    const errorMessage = err instanceof Error ? err.message : "Failed to generate form from voice";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

function getLanguageContext(language: string): string {
  const languageMap: Record<string, string> = {
    "en-US": "The transcript is in English (US). Generate field labels in English.",
    "en-GB": "The transcript is in English (UK). Generate field labels in English.",
    "es-ES": "The transcript is in Spanish. Generate field labels in Spanish.",
    "es-MX": "The transcript is in Spanish (Mexico). Generate field labels in Spanish.",
    "fr-FR": "The transcript is in French. Generate field labels in French.",
    "fr-CA": "The transcript is in French (Canada). Generate field labels in French.",
    "de-DE": "The transcript is in German. Generate field labels in German.",
    "zh-CN": "The transcript is in Chinese (Simplified). Generate field labels in Chinese.",
    "zh-TW": "The transcript is in Chinese (Traditional). Generate field labels in Chinese.",
    "ja-JP": "The transcript is in Japanese. Generate field labels in Japanese.",
  };

  return languageMap[language] || languageMap["en-US"];
}
