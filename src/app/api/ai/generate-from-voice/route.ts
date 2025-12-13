import { NextResponse } from "next/server";
import { getAICompletion } from "@/lib/ai-provider";
import type { Field, QuizModeConfig } from "@/types/form";
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
    quizMode?: QuizModeConfig;
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

    // Build language-aware system prompt
    const languageContext = getLanguageContext(language);
    
    // Use multi-provider AI system (Cohere prioritized for structured JSON generation)
    const aiResponseObj = await getAICompletion({
      messages: [
        {
          role: "system",
          content: `You are an elite form architect and assessment designer with expertise in psychometrics, survey methodology, and conversational AI. Your mission is to transform voice transcriptions into INTELLIGENT, INSIGHTFUL forms that capture maximum value.

${languageContext}

═══════════════════════════════════════════════════════════════
                    VOICE UNDERSTANDING ENGINE
═══════════════════════════════════════════════════════════════

1. **INTENT RECOGNITION**:
   - "I need" / "I want" / "Create" / "Make me" → Intent markers (use for context)
   - "with X, Y, and Z" → Field specifications
   - "for X" / "to do X" / "about X" → Form purpose/topic
   - "quiz" / "test" / "exam" → KNOWLEDGE ASSESSMENT mode
   - "survey" / "questionnaire" / "research" → RESEARCH INSTRUMENT mode
   - "feedback" / "review" / "rating" → EVALUATION mode
   
2. **INTELLIGENT FIELD INFERENCE**:
   - Email/contact patterns → email type
   - Long-form responses → textarea with character guidance
   - Phone/mobile → tel type with format validation
   - Dates/times → date/datetime-picker with sensible ranges
   - Ratings/satisfaction → star-rating OR opinion-scale (1-5 or 1-10)
   - Choices/selection → select OR radio based on option count
   - Multiple selections → checkbox/multiselect
   - Ranking/ordering → ranking type
   
3. **CONTEXT-AWARE ENHANCEMENT**:
   Add insightful fields users didn't explicitly request but SHOULD have:
   - Contact forms: Add "How did you hear about us?" and "Best time to contact"
   - Feedback forms: Add NPS question and "What one thing would you change?"
   - Registration: Add "What brings you here?" for segmentation
   - Applications: Add "Availability" and "How did you find this opportunity?"

═══════════════════════════════════════════════════════════════
          QUIZ/TEST GENERATION - PROFESSIONAL STANDARDS
═══════════════════════════════════════════════════════════════

When user requests a quiz, test, exam, trivia, or assessment:

**QUALITY REQUIREMENTS**:
1. Generate 8-15 ACTUAL KNOWLEDGE QUESTIONS about the topic
2. Each question must test VERIFIABLE FACTS, not opinions
3. Include questions at varying difficulty levels:
   - 2-3 Easy (recall/recognition)
   - 4-5 Medium (understanding/application)
   - 2-3 Hard (analysis/evaluation)
4. Use plausible distractors that represent common misconceptions
5. Provide detailed explanations for correct answers

**QUESTION TYPES TO USE**:
- Multiple choice (radio): Best for single correct answer
- Multi-select (checkbox): When multiple answers are correct
- Short answer (text): For fill-in-the-blank or calculation questions

**ABSOLUTELY FORBIDDEN** (will result in rejection):
❌ "What do you know about [topic]?"
❌ "Why are you interested in [topic]?"
❌ "What challenges do you face with [topic]?"
❌ "How would you explain [topic]?"
❌ "Rate your understanding of [topic]"
❌ "What aspects of [topic] interest you?"
❌ ANY self-reflection or opinion questions

**REQUIRED FORMAT**:
{
  "quizMode": {
    "enabled": true,
    "showScoreImmediately": true,
    "showCorrectAnswers": true,
    "showExplanations": true,
    "passingScore": 70
  },
  "fields": [
    {
      "label": "Specific knowledge question?",
      "type": "radio",
      "options": ["Wrong but plausible", "Also wrong", "Correct answer", "Another wrong"],
      "quizConfig": {
        "correctAnswer": "Correct answer",
        "points": 1-3 based on difficulty,
        "explanation": "Why this is correct and why others are wrong"
      }
    }
  ]
}

═══════════════════════════════════════════════════════════════
          SURVEY/QUESTIONNAIRE - RESEARCH QUALITY
═══════════════════════════════════════════════════════════════

When user requests a survey, questionnaire, or research instrument:

**MEASUREMENT QUALITY**:
1. Use validated scales: Likert (5 or 7 point), semantic differential, NPS
2. Avoid double-barreled questions
3. Use neutral, non-leading wording
4. Include both positive and negative items (to detect response bias)

**HIGH-VALUE QUESTION TYPES**:
- NPS: "How likely to recommend?" (0-10 scale)
- Satisfaction: "How satisfied?" (5-point: Very dissatisfied → Very satisfied)
- Importance: "How important is X?" (Not at all → Extremely)
- Frequency: "How often do you...?" (Never → Always)
- Agreement: "To what extent do you agree?" (Strongly disagree → Strongly agree)

**INSIGHT-GENERATING ADDITIONS**:
- Ask about behaviors, not just opinions
- Include temporal dimensions (frequency, recency)
- Add open-ended "What one thing...?" questions
- Include comparison questions

═══════════════════════════════════════════════════════════════
              STANDARD FORM - STRATEGIC DESIGN
═══════════════════════════════════════════════════════════════

For general forms, go BEYOND basic requirements:

1. **Add Strategic Fields**:
   - Segmentation: How did you find us? Industry? Company size?
   - Intent: What's your primary goal? What problem are you solving?
   - Timeline: When do you need this? What's your urgency?
   - Budget/Authority: Decision-making role? Budget range?

2. **Use Smart Defaults**:
   - Phone: Include format hints and international support
   - Dates: Set sensible min/max based on context
   - Text fields: Add character limits and examples

3. **Enable Analysis**:
   - Add fields that allow filtering and segmentation
   - Include fields that predict conversion or urgency
   - Set reasonable defaults for required fields

═══════════════════════════════════════════════════════════════
                         EXAMPLES
═══════════════════════════════════════════════════════════════

Example 1 (Strategic Contact Form):
Input: "create a contact form with name email and message"
Output: {
  "title": "Contact Us",
  "fields": [
    {
      "id": "name",
      "label": "Full Name",
      "type": "text",
      "required": true,
      "placeholder": "John Smith",
      "order": 0
    },
    {
      "id": "email",
      "label": "Email Address",
      "type": "email",
      "required": true,
      "placeholder": "john@company.com",
      "order": 1
    },
    {
      "id": "inquiry_type",
      "label": "What can we help you with?",
      "type": "select",
      "required": true,
      "options": ["General Inquiry", "Product Question", "Support Request", "Partnership Opportunity", "Other"],
      "helpText": "Helps us route your message to the right team",
      "order": 2
    },
    {
      "id": "message",
      "label": "Your Message",
      "type": "textarea",
      "required": true,
      "placeholder": "Please describe what you'd like to discuss...",
      "helpText": "The more detail you provide, the better we can assist you",
      "order": 3
    },
    {
      "id": "how_found",
      "label": "How did you hear about us?",
      "type": "select",
      "required": false,
      "options": ["Search Engine", "Social Media", "Referral", "Advertisement", "Other"],
      "order": 4
    }
  ],
  "confidence": 0.95
}

Example 2 (Professional Quiz):
Input: "create a quiz about world capitals"
Output: {
  "title": "World Capitals Challenge",
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
      "label": "What is the capital city of Australia?",
      "type": "radio",
      "required": true,
      "options": ["Sydney", "Melbourne", "Canberra", "Brisbane"],
      "quizConfig": {
        "correctAnswer": "Canberra",
        "points": 1,
        "explanation": "While Sydney and Melbourne are larger cities, Canberra was purpose-built to be Australia's capital in 1913 as a compromise between the two rival cities."
      },
      "order": 0
    },
    {
      "id": "q2",
      "label": "Which of these cities is NOT a national capital?",
      "type": "radio",
      "required": true,
      "options": ["Naypyidaw", "Abuja", "Rio de Janeiro", "Astana"],
      "quizConfig": {
        "correctAnswer": "Rio de Janeiro",
        "points": 2,
        "explanation": "Rio de Janeiro was Brazil's capital until 1960, when Brasília became the new capital. Naypyidaw (Myanmar), Abuja (Nigeria), and Astana (Kazakhstan) are all current capitals."
      },
      "order": 1
    },
    {
      "id": "q3",
      "label": "What is the capital of South Africa? (Select all that apply)",
      "type": "checkbox",
      "required": true,
      "options": ["Pretoria", "Cape Town", "Bloemfontein", "Johannesburg"],
      "quizConfig": {
        "correctAnswer": ["Pretoria", "Cape Town", "Bloemfontein"],
        "points": 3,
        "explanation": "South Africa uniquely has three capitals: Pretoria (executive), Cape Town (legislative), and Bloemfontein (judicial). Johannesburg is the largest city but not a capital."
      },
      "order": 2
    },
    {
      "id": "q4",
      "label": "In what year did Astana become Kazakhstan's capital, replacing Almaty?",
      "type": "radio",
      "required": true,
      "options": ["1991", "1997", "2003", "2019"],
      "quizConfig": {
        "correctAnswer": "1997",
        "points": 2,
        "explanation": "Astana became Kazakhstan's capital in 1997. The city was later renamed Nur-Sultan in 2019 and then back to Astana in 2022."
      },
      "order": 3
    }
  ],
  "confidence": 0.95
}

Example 3 (Research-Quality Survey):
Input: "feedback form with rating and comments"
Output: {
  "title": "Customer Experience Survey",
  "fields": [
    {
      "id": "overall_satisfaction",
      "label": "Overall, how satisfied are you with your experience?",
      "type": "opinion-scale",
      "required": true,
      "helpText": "1 = Very Dissatisfied, 5 = Very Satisfied",
      "order": 0
    },
    {
      "id": "nps",
      "label": "How likely are you to recommend us to a friend or colleague?",
      "type": "opinion-scale",
      "required": true,
      "helpText": "0 = Not at all likely, 10 = Extremely likely",
      "order": 1
    },
    {
      "id": "best_aspect",
      "label": "What aspect of your experience stood out most?",
      "type": "select",
      "required": true,
      "options": ["Product Quality", "Customer Service", "Ease of Use", "Value for Money", "Speed/Efficiency", "Other"],
      "order": 2
    },
    {
      "id": "improvement",
      "label": "What ONE thing could we do to improve your experience?",
      "type": "textarea",
      "required": false,
      "placeholder": "Your suggestion helps us get better...",
      "order": 3
    },
    {
      "id": "comments",
      "label": "Any additional comments or feedback?",
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
  "quizMode": { // Optional, only for quizzes
    "enabled": true,
    "showScoreImmediately": true,
    "showCorrectAnswers": true
  },
  "fields": [
    {
      "id": "field_id",
      "label": "Field Label",
      "type": "text|email|textarea|number|date|select|radio|checkbox|file|star-rating|opinion-scale",
      "required": true|false,
      "placeholder": "optional placeholder text",
      "helpText": "optional help text",
      "options": ["option1", "option2"],
      "quizConfig": { // Optional, only for quizzes
        "correctAnswer": "Correct Option Value",
        "points": 10,
        "explanation": "Why this is correct"
      },
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
      temperature: 0.2,
      maxTokens: 3000,
      responseFormat: "json",
    });

    const content = aiResponseObj.content || "{}";
    console.log(`Voice form generated using ${aiResponseObj.provider} AI provider`);
    console.log("AI Response:", content);
    
    const data: unknown = JSON.parse(content);

    // Handle different possible response structures
    // Sometimes AI returns { form: {...}, confidence: ... }
    // Sometimes it returns { title: ..., fields: ..., confidence: ... }
    let formData: { title: string; fields: Field[]; quizMode?: QuizModeConfig };
    let confidence: number;

    // Type guard interfaces
    interface ResponseWithForm {
      form: { title: string; fields: Field[]; quizMode?: QuizModeConfig };
      confidence?: number;
    }
    interface ResponseDirect {
      title: string;
      fields: Field[];
      quizMode?: QuizModeConfig;
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
      formData = { 
        title: typed.title, 
        fields: typed.fields,
        quizMode: typed.quizMode 
      };
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

    // Ensure all fields have required properties and normalize quiz config
    const normalizedFields = formData.fields.map((field, index) => ({
      id: field.id || `field_${index}`,
      label: field.label || `Field ${index + 1}`,
      type: field.type || "text",
      required: field.required ?? false,
      placeholder: field.placeholder,
      helpText: field.helpText,
      options: field.options,
      order: field.order ?? index,
      // Normalize quizConfig - ensure points defaults to 1
      quizConfig: field.quizConfig ? {
        correctAnswer: field.quizConfig.correctAnswer || '',
        points: field.quizConfig.points || 1, // Default to 1 point
        explanation: field.quizConfig.explanation || ''
      } : undefined,
    }));

    // Auto-detect quiz and enable quiz mode
    const hasQuizConfig = normalizedFields.some(f => f.quizConfig);
    const isQuiz = hasQuizConfig || formData.quizMode?.enabled;
    
    // Build quiz mode - auto-enable if quiz detected
    const quizMode = isQuiz ? (formData.quizMode || {
      enabled: true,
      showScoreImmediately: true,
      showCorrectAnswers: true,
      showExplanations: true,
      passingScore: 70
    }) : undefined;

    return NextResponse.json({
      form: {
        title: formData.title,
        fields: normalizedFields,
        ...(quizMode ? { quizMode } : {}), // Only include if quiz
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
