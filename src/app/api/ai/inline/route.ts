import { NextRequest, NextResponse } from "next/server";
import { getAICompletion } from "@/lib/ai-provider";

export const runtime = "nodejs";

type InlineAIAction =
  | "improve-question"
  | "rewrite-concise"
  | "rewrite-formal"
  | "rewrite-casual"
  | "fix-grammar"
  | "translate"
  | "generate-options"
  | "add-more-options"
  | "suggest-placeholder"
  | "suggest-help-text"
  | "suggest-validation"
  | "generate-distractors"
  | "explain-answer"
  | "suggest-follow-up"
  | "suggest-section-name"
  | "check-accessibility"
  | "suggest-conditional-logic";

interface InlineAIRequest {
  action: InlineAIAction;
  context: {
    fieldLabel?: string;
    fieldType?: string;
    currentValue?: string;
    options?: string[];
    correctAnswer?: string | string[];
    formTitle?: string;
    formContext?: string; // What the form is about
    targetLanguage?: string; // For translation
    otherFields?: { label: string; type: string }[]; // For conditional logic
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: InlineAIRequest = await req.json();
    const { action, context } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    let prompt = "";
    const responseFormat: "json" | "text" = "json";

    switch (action) {
      case "improve-question":
        prompt = buildImproveQuestionPrompt(context);
        break;
      case "rewrite-concise":
        prompt = buildRewritePrompt(context, "concise");
        break;
      case "rewrite-formal":
        prompt = buildRewritePrompt(context, "formal");
        break;
      case "rewrite-casual":
        prompt = buildRewritePrompt(context, "casual");
        break;
      case "fix-grammar":
        prompt = buildFixGrammarPrompt(context);
        break;
      case "translate":
        prompt = buildTranslatePrompt(context);
        break;
      case "generate-options":
        prompt = buildGenerateOptionsPrompt(context);
        break;
      case "add-more-options":
        prompt = buildAddMoreOptionsPrompt(context);
        break;
      case "suggest-placeholder":
        prompt = buildSuggestPlaceholderPrompt(context);
        break;
      case "suggest-help-text":
        prompt = buildSuggestHelpTextPrompt(context);
        break;
      case "suggest-validation":
        prompt = buildSuggestValidationPrompt(context);
        break;
      case "generate-distractors":
        prompt = buildGenerateDistractorsPrompt(context);
        break;
      case "explain-answer":
        prompt = buildExplainAnswerPrompt(context);
        break;
      case "suggest-follow-up":
        prompt = buildSuggestFollowUpPrompt(context);
        break;
      case "suggest-section-name":
        prompt = buildSuggestSectionNamePrompt(context);
        break;
      case "check-accessibility":
        prompt = buildCheckAccessibilityPrompt(context);
        break;
      case "suggest-conditional-logic":
        prompt = buildSuggestConditionalLogicPrompt(context);
        break;
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const systemPrompt = `You are an expert form designer and UX specialist. Your responses must be helpful, professional, and immediately usable. Always respond in valid JSON format as specified in the prompt.`;

    const result = await getAICompletion({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      maxTokens: 1000,
      responseFormat,
      preferredProvider: "groq",
    });

    // Parse JSON response
    let parsed;
    try {
      // Clean up the response - remove markdown code blocks if present
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
      // If parsing fails, return the raw content
      parsed = { result: result.content };
    }

    return NextResponse.json({
      success: true,
      action,
      data: parsed,
    });
  } catch (error) {
    console.error("Inline AI error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process AI request" },
      { status: 500 }
    );
  }
}

// Prompt builders

function buildImproveQuestionPrompt(context: InlineAIRequest["context"]): string {
  return `Improve this form question to be clearer and more effective.

Current question: "${context.fieldLabel || context.currentValue}"
Field type: ${context.fieldType || "text"}
Form context: ${context.formContext || "general form"}

Provide 3 improved versions. Return JSON:
{
  "suggestions": [
    { "text": "improved version 1", "reason": "why this is better" },
    { "text": "improved version 2", "reason": "why this is better" },
    { "text": "improved version 3", "reason": "why this is better" }
  ]
}`;
}

function buildRewritePrompt(context: InlineAIRequest["context"], style: "concise" | "formal" | "casual"): string {
  const styleInstructions = {
    concise: "Make it shorter and more direct while keeping the same meaning.",
    formal: "Make it more professional and formal in tone.",
    casual: "Make it friendly and conversational.",
  };

  return `Rewrite this form question in a ${style} style.
${styleInstructions[style]}

Current question: "${context.fieldLabel || context.currentValue}"

Return JSON:
{
  "rewritten": "the rewritten question",
  "original": "${context.fieldLabel || context.currentValue}"
}`;
}

function buildFixGrammarPrompt(context: InlineAIRequest["context"]): string {
  return `Fix any grammar, spelling, or punctuation errors in this form question.

Current text: "${context.fieldLabel || context.currentValue}"

Return JSON:
{
  "fixed": "the corrected text",
  "changes": ["list of changes made"],
  "hadErrors": true/false
}`;
}

function buildTranslatePrompt(context: InlineAIRequest["context"]): string {
  return `Translate this form question to ${context.targetLanguage || "Spanish"}.

Current text: "${context.fieldLabel || context.currentValue}"

Return JSON:
{
  "translated": "the translated text",
  "targetLanguage": "${context.targetLanguage || "Spanish"}"
}`;
}

function buildGenerateOptionsPrompt(context: InlineAIRequest["context"]): string {
  return `Generate appropriate options for this form question.

Question: "${context.fieldLabel}"
Field type: ${context.fieldType} (${context.fieldType === "multiple-choice" || context.fieldType === "radio" ? "single selection" : "may allow multiple selections"})
Form context: ${context.formContext || "general form"}

Generate 4-6 relevant, comprehensive options. Include an "Other" option if appropriate.

Return JSON:
{
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "includesOther": true/false
}`;
}

function buildAddMoreOptionsPrompt(context: InlineAIRequest["context"]): string {
  return `Add more options similar to the existing ones for this form question.

Question: "${context.fieldLabel}"
Current options: ${JSON.stringify(context.options || [])}

Generate 3-4 additional relevant options that complement the existing ones without duplicating them.

Return JSON:
{
  "newOptions": ["New option 1", "New option 2", "New option 3"]
}`;
}

function buildSuggestPlaceholderPrompt(context: InlineAIRequest["context"]): string {
  return `Suggest a helpful placeholder text for this form field.

Question label: "${context.fieldLabel}"
Field type: ${context.fieldType}

The placeholder should:
- Give a clear example of expected input
- Be brief (3-5 words typically)
- Help users understand the format expected

Return JSON:
{
  "placeholder": "suggested placeholder text",
  "alternative": "alternative suggestion"
}`;
}

function buildSuggestHelpTextPrompt(context: InlineAIRequest["context"]): string {
  return `Suggest helpful description/help text for this form field.

Question label: "${context.fieldLabel}"
Field type: ${context.fieldType}
Current placeholder: "${context.currentValue || "none"}"

The help text should:
- Explain what information is needed
- Clarify any requirements or format
- Be concise (1-2 sentences)

Return JSON:
{
  "helpText": "suggested help text",
  "alternative": "alternative suggestion"
}`;
}

function buildSuggestValidationPrompt(context: InlineAIRequest["context"]): string {
  return `Suggest appropriate validation rules for this form field.

Question label: "${context.fieldLabel}"
Field type: ${context.fieldType}

Return JSON with applicable validation rules:
{
  "suggestions": [
    {
      "type": "minLength" | "maxLength" | "min" | "max" | "pattern",
      "value": "the value",
      "message": "error message to show",
      "reason": "why this validation makes sense"
    }
  ],
  "shouldBeRequired": true/false,
  "requiredReason": "why it should/shouldn't be required"
}`;
}

function buildGenerateDistractorsPrompt(context: InlineAIRequest["context"]): string {
  return `Generate plausible but incorrect answer options (distractors) for this quiz question.

Question: "${context.fieldLabel}"
Correct answer: ${JSON.stringify(context.correctAnswer)}
Current options: ${JSON.stringify(context.options || [])}

Create 3-4 distractors that:
- Are plausible enough to be tempting
- Are clearly incorrect upon careful thought
- Cover common misconceptions
- Are similar in length/format to the correct answer

Return JSON:
{
  "distractors": [
    { "text": "distractor 1", "whyWrong": "brief explanation" },
    { "text": "distractor 2", "whyWrong": "brief explanation" },
    { "text": "distractor 3", "whyWrong": "brief explanation" }
  ]
}`;
}

function buildExplainAnswerPrompt(context: InlineAIRequest["context"]): string {
  return `Generate a clear explanation for the correct answer to this quiz question.

Question: "${context.fieldLabel}"
Correct answer: ${JSON.stringify(context.correctAnswer)}
Other options: ${JSON.stringify(context.options?.filter(o => 
  Array.isArray(context.correctAnswer) 
    ? !context.correctAnswer.includes(o) 
    : o !== context.correctAnswer
) || [])}

Create an educational explanation that:
- Explains why the correct answer is right
- Briefly explains why other options are wrong (if applicable)
- Provides helpful context for learning

Return JSON:
{
  "explanation": "detailed explanation text",
  "keyPoint": "one-sentence summary of the key learning"
}`;
}

function buildSuggestFollowUpPrompt(context: InlineAIRequest["context"]): string {
  return `Suggest relevant follow-up questions based on this form field.

Current question: "${context.fieldLabel}"
Field type: ${context.fieldType}
Form title: "${context.formTitle || "Untitled Form"}"
Form context: ${context.formContext || "general form"}

Suggest 3 follow-up questions that would logically come after this question.

Return JSON:
{
  "suggestions": [
    { 
      "label": "suggested question text", 
      "type": "recommended field type",
      "reason": "why this follow-up makes sense",
      "options": ["option1", "option2"] // only for choice fields
    },
    { 
      "label": "suggested question text", 
      "type": "recommended field type",
      "reason": "why this follow-up makes sense"
    },
    { 
      "label": "suggested question text", 
      "type": "recommended field type",
      "reason": "why this follow-up makes sense"
    }
  ]
}`;
}

function buildSuggestSectionNamePrompt(context: InlineAIRequest["context"]): string {
  const fields = context.otherFields || [];
  return `Suggest a section/page title that groups these form fields.

Fields in this section:
${fields.map(f => `- ${f.label} (${f.type})`).join("\n")}

Form title: "${context.formTitle || "Untitled Form"}"

Return JSON:
{
  "sectionName": "suggested section title",
  "alternatives": ["alternative 1", "alternative 2"]
}`;
}

function buildCheckAccessibilityPrompt(context: InlineAIRequest["context"]): string {
  return `Check this form field for accessibility issues and suggest improvements.

Question label: "${context.fieldLabel}"
Field type: ${context.fieldType}
Placeholder: "${context.currentValue || "none"}"
Options: ${JSON.stringify(context.options || [])}

Check for:
- Clear, descriptive labels
- Screen reader compatibility
- Color-independent information
- Clear instructions

Return JSON:
{
  "score": 1-10,
  "issues": [
    { "issue": "description of issue", "severity": "high/medium/low", "fix": "how to fix it" }
  ],
  "suggestions": ["general improvement suggestions"],
  "isAccessible": true/false
}`;
}

function buildSuggestConditionalLogicPrompt(context: InlineAIRequest["context"]): string {
  const otherFields = context.otherFields || [];
  return `Suggest conditional logic rules for this form field.

Current field: "${context.fieldLabel}" (${context.fieldType})
Options: ${JSON.stringify(context.options || [])}

Other fields in the form:
${otherFields.map(f => `- "${f.label}" (${f.type})`).join("\n")}

Suggest logical show/hide rules based on field relationships.

Return JSON:
{
  "suggestions": [
    {
      "condition": "description of when to show/hide",
      "sourceField": "the field that triggers this",
      "operator": "equals/notEquals/contains/isEmpty",
      "value": "the triggering value",
      "action": "show/hide",
      "reason": "why this makes sense"
    }
  ]
}`;
}
