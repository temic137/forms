import { NextRequest, NextResponse } from "next/server";
import { getAICompletion } from "@/lib/ai-provider";
import { Field, FieldType } from "@/types/form";

export const runtime = "nodejs";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface FormContext {
  title: string;
  fields: Field[];
}

interface ChatRequest {
  message: string;
  history: ChatMessage[];
  formContext: FormContext;
}

interface FieldModification {
  action: "add" | "update" | "delete" | "reorder";
  fieldId?: string;
  field?: Partial<Field>;
  position?: number; // For reorder
  newIndex?: number; // For reorder
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
    ? formContext.fields.map((f, i) => 
        `${i + 1}. [ID: ${f.id}] "${f.label}" (type: ${f.type})${f.required ? " *required" : ""}${Array.isArray(f.options) && f.options.length > 0 ? ` options: [${f.options.join(", ")}]` : ""}`
      ).join("\n")
    : "No fields yet";

  return `You are an intelligent form builder assistant. You help users create and modify forms through natural conversation.

CURRENT FORM STATE:
Title: "${formContext.title}"
Fields:
${fieldsDescription}

YOUR CAPABILITIES:
1. Add new fields to the form
2. Update existing field properties (label, type, required, options, placeholder, helpText)
3. Delete fields
4. Reorder fields
5. Update form title
6. Answer questions about form best practices

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
    // Optional array of modifications to apply
    {
      "action": "add",
      "field": {
        "label": "Field Label",
        "type": "short-answer",
        "required": false,
        "placeholder": "Optional placeholder",
        "helpText": "Optional help text",
        "options": ["Option 1", "Option 2"] // Only for choice fields
      }
    },
    {
      "action": "update",
      "fieldId": "existing_field_id",
      "field": {
        "label": "New Label",
        // Only include properties being changed
      }
    },
    {
      "action": "delete",
      "fieldId": "field_id_to_delete"
    },
    {
      "action": "reorder",
      "fieldId": "field_id",
      "newIndex": 0 // 0-based index
    }
  ],
  "newTitle": "New Form Title" // Optional, only if changing title
}

GUIDELINES:
1. Be conversational and helpful
2. Explain what changes you're making
3. If the user's request is unclear, ask for clarification
4. Suggest improvements when appropriate
5. For multiple-choice type fields, always include sensible options
6. Use appropriate field types based on context (e.g., "email" for email addresses)
7. When adding multiple fields, add them in logical order
8. Reference existing fields by their number (1-based) or label when updating/deleting
9. If user asks to add a field that seems to already exist, confirm or suggest updating instead

IMPORTANT:
- Always respond with valid JSON
- The "message" field is required
- Include "modifications" only when making changes
- Use field IDs exactly as shown when updating or deleting
- Generate new unique IDs for new fields (format: field_{timestamp}_{random})`;
}

function sanitizeModification(mod: FieldModification, formContext: FormContext): FieldModification {
  const sanitized = { ...mod };

  // Ensure action is valid
  if (!["add", "update", "delete", "reorder"].includes(mod.action)) {
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

  // For update/delete, verify fieldId exists
  if ((mod.action === "update" || mod.action === "delete" || mod.action === "reorder") && mod.fieldId) {
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

  // Validate reorder index
  if (mod.action === "reorder" && typeof mod.newIndex === "number") {
    sanitized.newIndex = Math.max(0, Math.min(mod.newIndex, formContext.fields.length - 1));
  }

  return sanitized;
}
