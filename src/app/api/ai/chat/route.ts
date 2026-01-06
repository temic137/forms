import { NextRequest, NextResponse } from "next/server";
import { getAICompletion } from "@/lib/ai-provider";
import { Field, FieldType, QuizConfig } from "@/types/form";

export const runtime = "nodejs";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface FormContext {
  title: string;
  fields: Field[];
  selectedFieldId?: string;
}

interface ChatRequest {
  message: string;
  history: ChatMessage[];
  formContext: FormContext;
}

interface FieldModification {
  action: "add" | "update" | "delete" | "reorder" | "quiz-config";
  fieldId?: string;
  field?: Partial<Field>;
  position?: number; // For reorder
  newIndex?: number; // For reorder
  quizConfig?: QuizConfig; // For quiz configuration
}

interface ChatResponse {
  message: string;
  modifications?: FieldModification[];
  newTitle?: string;
}

const VALID_FIELD_TYPES: FieldType[] = [
  "short-answer", "long-answer", "text", "textarea",
  "email", "phone", "address",
  "number", "currency",
  "multiple-choice", "choices", "dropdown", "multiselect", "checkbox", "checkboxes", "radio", "select",
  "date", "time", "date-picker",
  "star-rating", "slider", "opinion-scale", "ranking",
  "file", "file-uploader",
  "display-text", "heading", "paragraph", "divider",
];

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const { message, history, formContext } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const systemPrompt = buildSystemPrompt(formContext);
    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...history.map(h => ({ role: h.role as "user" | "assistant", content: h.content })),
      { role: "user" as const, content: message },
    ];

    const result = await getAICompletion({
      messages,
      temperature: 0.7,
      maxTokens: 2000,
      responseFormat: "json",
    });

    let parsed: ChatResponse;
    try {
      let cleanResult = result.content.trim();
      if (cleanResult.startsWith("```json")) {
        cleanResult = cleanResult.slice(7);
      }
      if (cleanResult.startsWith("```")) {
        cleanResult = cleanResult.slice(3);
      }
      if (cleanResult.endsWith("```")) {
        cleanResult = cleanResult.slice(0, -3);
      }
      parsed = JSON.parse(cleanResult.trim());
    } catch {
      parsed = { message: result.content };
    }

    // Validate and sanitize modifications
    if (parsed.modifications) {
      parsed.modifications = parsed.modifications.map(mod => sanitizeModification(mod, formContext));
    }

    return NextResponse.json({
      success: true,
      ...parsed,
    });
  } catch (error) {
    console.error("AI Chat error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process AI request" },
      { status: 500 }
    );
  }
}

function buildSystemPrompt(formContext: FormContext): string {
  const fieldsDescription = formContext.fields.length > 0
    ? formContext.fields.map((f, i) => {
        let desc = `${i + 1}. [ID: ${f.id}] "${f.label}" (type: ${f.type})${f.required ? " *required" : ""}`;
        if (Array.isArray(f.options) && f.options.length > 0) {
          desc += ` options: [${f.options.map((o, idx) => `${String.fromCharCode(65 + idx)}="${o}"`).join(", ")}]`;
        }
        if (f.quizConfig) {
          if (f.quizConfig.correctAnswer !== undefined) {
            desc += ` [QUIZ: correct="${f.quizConfig.correctAnswer}"`;
            if (f.quizConfig.points) desc += `, points=${f.quizConfig.points}`;
            if (f.quizConfig.explanation) desc += `, has explanation`;
            desc += `]`;
          }
        }
        return desc;
      }).join("\n")
    : "No fields yet";

  const selectedFieldInfo = formContext.selectedFieldId 
    ? `\n\nCURRENTLY SELECTED FIELD: ${formContext.fields.find(f => f.id === formContext.selectedFieldId)?.label || formContext.selectedFieldId} (ID: ${formContext.selectedFieldId})
When the user says "this field", "selected field", "the current field", or similar, they are referring to this field.`
    : "";

  const lastFieldInfo = formContext.fields.length > 0
    ? `\nLAST FIELD: "${formContext.fields[formContext.fields.length - 1].label}" (field ${formContext.fields.length})`
    : "";

  return `You are an intelligent form builder assistant with advanced natural language understanding. You help users create and modify forms through natural conversation.

CURRENT FORM STATE:
Title: "${formContext.title}"
Total Fields: ${formContext.fields.length}
Fields:
${fieldsDescription}${selectedFieldInfo}${lastFieldInfo}

YOUR CAPABILITIES:
1. Add new fields to the form
2. Update existing field properties (label, type, required, options, placeholder, helpText)
3. Delete fields
4. Reorder fields
5. Update form title
6. Configure quiz settings (correct answers, points, explanations)
7. Answer questions about form best practices
8. Handle complex multi-step requests
9. Clone/duplicate fields with modifications
10. Batch operations on multiple fields

VALID FIELD TYPES:
- Text inputs: "short-answer", "long-answer", "text", "textarea"
- Contact: "email", "phone", "address"
- Numbers: "number", "currency"
- Choices: "multiple-choice", "dropdown", "multiselect", "checkbox", "checkboxes", "radio", "select"
- Date/Time: "date", "time", "date-picker"
- Rating: "star-rating", "slider", "opinion-scale", "ranking"
- Files: "file", "file-uploader"
- Display: "display-text", "heading", "paragraph", "divider"

RESPONSE FORMAT (JSON):
{
  "message": "Your friendly response explaining what you did or answering the user's question",
  "modifications": [
    {
      "action": "add",
      "field": {
        "label": "Field Label",
        "type": "short-answer",
        "required": false,
        "placeholder": "Optional placeholder",
        "helpText": "Optional help text",
        "options": ["Option 1", "Option 2"],
        "quizConfig": {
          "correctAnswer": "Option 1",
          "points": 10,
          "explanation": "Explanation shown after submission"
        }
      }
    },
    {
      "action": "update",
      "fieldId": "existing_field_id",
      "field": { "label": "New Label" }
    },
    {
      "action": "delete",
      "fieldId": "field_id_to_delete"
    },
    {
      "action": "reorder",
      "fieldId": "field_id",
      "newIndex": 0
    },
    {
      "action": "quiz-config",
      "fieldId": "field_id",
      "quizConfig": {
        "correctAnswer": "Option B",
        "points": 5,
        "explanation": "Why this is correct"
      }
    }
  ],
  "newTitle": "New Form Title"
}

ADVANCED NATURAL LANGUAGE UNDERSTANDING:

1. MULTI-STEP COMMANDS - Execute ALL steps in a single response:
   User: "Add name and email fields, then make them required"
   → Add "Name" field, Add "Email" field, Update both to required=true
   
   User: "Add 3 multiple choice questions about colors"
   → Add 3 separate multiple-choice fields with color-related questions
   
   User: "Create a contact section with name, email, and phone"
   → Add all 3 fields in logical order

2. FIELD REFERENCES - Understand various reference patterns:
   - Numbers: "field 1", "question 2", "the third one" → Use 1-based indexing
   - Labels: "the name field", "email question" → Match by label substring
   - Position: "the last field", "first question", "previous one" → Position-based
   - Selection: "this field", "selected field", "current one" → Use selectedFieldId
   - Groups: "all fields", "every question", "fields 1-3" → Multiple fields
   - Relative: "the one above", "next field", "before this" → Relative position

3. CORRECTIONS AND CLARIFICATIONS:
   User: "No, I meant field 3" → Apply previous action to field 3 instead
   User: "Actually, make it optional" → Update last mentioned field to required=false
   User: "Wait, not that one, the email field" → Clarify and apply to correct field
   User: "Undo that" or "Revert" → Explain user should use undo button (you can't undo)

4. COMPARISONS AND CLONING:
   User: "Add a field like field 1" → Clone field 1's properties to new field
   User: "Make field 2 similar to field 1 but optional" → Copy properties, set required=false
   User: "Same type as above" → Use same type as previous action/field

5. QUIZ MODE COMMANDS:
   - Setting answers: "The answer is B", "Correct answer is Option 2", "Answer: Yes"
   - Points: "Worth 5 points", "10 points for this", "Make it 5pts"
   - Explanations: "Explanation: Because...", "Add hint: ...", "Reason: ..."
   - Multiple correct: "Correct answers are A and C", "Both B and D are right"
   - Number answers: "Correct answer is 42" (for number fields)
   - Boolean: "The answer is true/yes/correct" (for checkbox)

6. BATCH OPERATIONS:
   User: "Make all fields required" → Update ALL fields with required=true
   User: "Set all questions to 5 points" → Update quiz config for all fields
   User: "Delete fields 2-4" → Delete fields 2, 3, and 4
   User: "Reorder: put email first" → Move email field to position 0

7. CONTEXT MEMORY - Remember from conversation:
   - "Change its label" → Refers to last discussed field
   - "Add another one" → Add similar field to last added
   - "Make it required too" → Apply required to field like previous one
   - "The same for field 2" → Apply same modification to field 2

RESPONSE GUIDELINES:
1. Be conversational and confirm what you did
2. For multi-step commands, explain each action briefly
3. If ambiguous, ask ONE clarifying question
4. Suggest improvements when relevant
5. For choice fields, always include sensible default options
6. Match field types to context (email → "email", rating → "star-rating")
7. When cloning, clearly state which properties were copied
8. For corrections, acknowledge the mistake and fix it
9. For batch operations, summarize what was changed

IMPORTANT RULES:
- Always respond with valid JSON
- "message" field is REQUIRED
- Include "modifications" only when making actual changes
- Use EXACT field IDs from the form state when updating/deleting
- Generate unique IDs: field_{timestamp}_{random}
- For quiz-config, always include fieldId
- Don't repeat modifications (each action once)
- When uncertain about field reference, list options and ask`;
}

function sanitizeModification(mod: FieldModification, formContext: FormContext): FieldModification {
  const sanitized = { ...mod };

  // Ensure action is valid
  if (!["add", "update", "delete", "reorder", "quiz-config"].includes(mod.action)) {
    sanitized.action = "add";
  }

  // For add actions, ensure field has required properties
  if (mod.action === "add" && mod.field) {
    const field = mod.field;
    
    // Generate ID if not provided
    if (!field.id) {
      field.id = `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Ensure type is valid
    if (!field.type || !VALID_FIELD_TYPES.includes(field.type as FieldType)) {
      field.type = "short-answer";
    }

    // Ensure label exists
    if (!field.label) {
      field.label = "New Field";
    }

    // Set default required
    if (typeof field.required !== "boolean") {
      field.required = false;
    }

    // Set order
    field.order = formContext.fields.length;

    // Ensure options for choice fields
    const choiceTypes = ["multiple-choice", "dropdown", "multiselect", "checkbox", "checkboxes", "radio", "select", "ranking"];
    if (choiceTypes.includes(field.type as string) && !field.options) {
      field.options = ["Option 1", "Option 2", "Option 3"];
    }

    sanitized.field = field;
  }

  // For update/delete/reorder/quiz-config, verify fieldId exists
  if ((mod.action === "update" || mod.action === "delete" || mod.action === "reorder" || mod.action === "quiz-config") && mod.fieldId) {
    const fieldExists = formContext.fields.some(f => f.id === mod.fieldId);
    if (!fieldExists) {
      // Try to find field by index (1-based) or partial label match
      const possibleIndex = parseInt(mod.fieldId) - 1;
      if (possibleIndex >= 0 && possibleIndex < formContext.fields.length) {
        sanitized.fieldId = formContext.fields[possibleIndex].id;
      } else {
        // Try partial label match
        const matchingField = formContext.fields.find(f => 
          f.label.toLowerCase().includes(mod.fieldId!.toLowerCase())
        );
        if (matchingField) {
          sanitized.fieldId = matchingField.id;
        }
      }
    }
  }

  // For quiz-config action, ensure quizConfig exists
  if (mod.action === "quiz-config") {
    if (!mod.quizConfig) {
      sanitized.quizConfig = {};
    }
    // Validate quiz config properties
    if (sanitized.quizConfig) {
      // Ensure points is a number if provided
      if (sanitized.quizConfig.points !== undefined) {
        sanitized.quizConfig.points = Number(sanitized.quizConfig.points) || 1;
      }
    }
  }

  // Validate reorder index
  if (mod.action === "reorder" && typeof mod.newIndex === "number") {
    sanitized.newIndex = Math.max(0, Math.min(mod.newIndex, formContext.fields.length - 1));
  }

  return sanitized;
}
