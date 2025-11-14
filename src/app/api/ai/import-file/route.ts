import { NextRequest, NextResponse } from "next/server";
import { getAICompletion } from "@/lib/ai-provider";

export const runtime = "nodejs";

type Field = {
  id: string;
  label: string;
  type: "text" | "email" | "textarea" | "number" | "date" | "select" | "radio" | "checkbox" | "tel" | "url" | "file";
  required: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
};

type ContentType = "form_template" | "structured_data" | "unstructured_content" | "form_description";

interface ContentAnalysis {
  contentType: ContentType;
  confidence: number;
  reasoning: string;
  hasFormFields: boolean;
  extractedFields?: Partial<Field>[];
}

class FormImportError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "FormImportError";
    this.status = status;
  }
}

// Parse CSV content
function parseCSV(content: string): { fields: Partial<Field>[] } {
  const lines = content.trim().split("\n");
  if (lines.length < 2) {
    throw new FormImportError("CSV file must contain headers and at least one row");
  }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const fields: Partial<Field>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    const field: Partial<Field> = {};

    headers.forEach((header, index) => {
      const value = values[index]?.trim();
      
      if (header === "label" || header === "name") {
        field.label = value;
        field.id = value?.toLowerCase().replace(/\s+/g, "_") || `field_${i}`;
      } else if (header === "type") {
        field.type = value as Field["type"];
      } else if (header === "required") {
        field.required = value?.toLowerCase() === "true" || value === "1";
      } else if (header === "options") {
        if (value) {
          // Handle options in quotes or pipe-separated
          const cleanedValue = value.replace(/^["']|["']$/g, "");
          field.options = cleanedValue.split(/[|,]/).map((opt) => opt.trim());
        }
      } else if (header === "placeholder") {
        field.placeholder = value;
      }
    });

    if (field.label) {
      fields.push(field);
    }
  }

  return { fields };
}

// Parse JSON content
function parseJSON(content: string): { title?: string; fields: Partial<Field>[] } {
  const data = JSON.parse(content);
  
  if (Array.isArray(data)) {
    // Array of fields
    return { fields: data };
  } else if (data.fields && Array.isArray(data.fields)) {
    // Object with fields array
    return {
      title: data.title,
      fields: data.fields,
    };
  } else {
    throw new FormImportError("Invalid JSON structure. Expected array or object with 'fields' property");
  }
}

// Analyze content to determine what kind of data it is
async function analyzeContent(content: string, fileType: string): Promise<ContentAnalysis> {
  // Truncate content if too long (keep first 3000 chars for analysis)
  const analysisContent = content.length > 3000 ? content.substring(0, 3000) + "..." : content;

  const prompt = `You are an expert content analyzer. Analyze the following content from a ${fileType} file and determine what type of content it is.

CONTENT:
"""
${analysisContent}
"""

Your task is to determine:
1. What type of content this is:
   - "form_template": An actual form with clearly labeled fields (e.g., "Name: ____", "Email: ____")
   - "structured_data": Structured data like a list of field names, a CSV-like format, or a schema
   - "form_description": A description of what form should be created (e.g., "Create a contact form with name and email")
   - "unstructured_content": General text content (articles, documentation, knowledge bases, etc.)

2. Whether it contains extractable form fields
3. Your confidence level (0-1)
4. Reasoning for your classification

IMPORTANT RULES:
- If the content is general text, documentation, articles, or knowledge bases → "unstructured_content"
- Only classify as "form_template" if you see actual form field labels with input placeholders
- Only classify as "structured_data" if it's a clear list of field names or structured schema
- Classify as "form_description" if it describes what form to create but isn't the form itself

Return ONLY valid JSON with this structure:
{
  "contentType": "form_template" | "structured_data" | "form_description" | "unstructured_content",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of why you classified it this way",
  "hasFormFields": true|false
}`;

  const response = await getAICompletion({
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1,
    maxTokens: 500,
    responseFormat: "json",
  });

  const content_str = response.content.trim() || "{}";
  
  try {
    const analysis: ContentAnalysis = JSON.parse(content_str);
    return analysis;
  } catch (error) {
    console.error("Failed to parse content analysis:", error);
    // Default to unstructured if we can't analyze
    return {
      contentType: "unstructured_content",
      confidence: 0.5,
      reasoning: "Failed to analyze content",
      hasFormFields: false,
    };
  }
}

// Parse content based on its type
async function parseContentIntelligently(content: string, analysis: ContentAnalysis, fileType: string): Promise<{ title: string; fields: Partial<Field>[] }> {
  let systemPrompt = "";
  let userPrompt = "";

  if (analysis.contentType === "unstructured_content") {
    // For unstructured content, intelligently generate a relevant form based on the content's purpose
    systemPrompt = `You are a brilliant form generation expert. The user has uploaded general content/documentation. Your job is to understand what the content is about and generate a RELEVANT, USEFUL form based on that content's purpose.`;
    
    userPrompt = `Analyze this content and generate a relevant form that would make sense for someone reading this:

"""
${content.length > 3000 ? content.substring(0, 3000) + "..." : content}
"""

INSTRUCTIONS:
1. Understand the main topic/purpose of this content (product, service, article, knowledge base, etc.)
2. Generate a form that would be CONTEXTUALLY RELEVANT to this content
3. Think: "What would someone reading this content want to do next?"

Examples of smart form generation:
- Product/service description → Contact form, demo request, or inquiry form
- Knowledge base/FAQ → Support request or question form
- Article/blog → Comment, feedback, or newsletter signup form
- Event info → Registration or RSVP form
- Company info → Contact, partnership, or career inquiry form

REQUIREMENTS:
- Generate 5-8 relevant fields (keep it focused!)
- Make fields contextual to the content topic
- Always include: full name, email
- Add 3-6 topic-specific fields based on what the content is about
- Use appropriate field types
- Add helpful placeholders and help text
- Make the form title descriptive and relevant to the content

Return ONLY valid JSON:
{
  "title": "Relevant Form Title (e.g., 'Contact Us About [Topic]')",
  "fields": [
    {
      "id": "unique_id",
      "label": "Field Label",
      "type": "text|email|textarea|number|date|select|radio|checkbox|tel|url|file",
      "required": true|false,
      "placeholder": "helpful placeholder",
      "helpText": "optional guidance text",
      "options": ["if select/radio/checkbox"]
    }
  ]
}`;
  } else if (analysis.contentType === "form_description") {
    // User described what form they want
    systemPrompt = `You are a form generation expert. The user has described what kind of form they want to create. Generate an appropriate form based on their description.`;
    
    userPrompt = `Based on this description, create a complete form:

"""
${content}
"""

Generate a form with appropriate fields, types, and validation. Return ONLY valid JSON:
{
  "title": "Descriptive Form Title",
  "fields": [
    {
      "id": "unique_id",
      "label": "Field Label",
      "type": "text|email|textarea|number|date|select|radio|checkbox|tel|url|file",
      "required": true|false,
      "placeholder": "helpful placeholder",
      "helpText": "optional guidance",
      "options": ["if select/radio/checkbox"]
    }
  ]
}`;
  } else if (analysis.contentType === "structured_data") {
    // User provided a list of fields or structured data
    systemPrompt = `You are a form generation expert. The user has provided structured field data. Convert it into a complete form structure.`;
    
    userPrompt = `Convert this structured data into a complete form:

"""
${content}
"""

IMPORTANT RULES:
- Each meaningful item should become ONE form field
- Do NOT create fields from headers, titles, or descriptive text
- Only create fields from actual data items that require user input
- Infer appropriate field types from the names/labels
- Add helpful placeholders and validation

Return ONLY valid JSON:
{
  "title": "Descriptive Form Title",
  "fields": [
    {
      "id": "unique_id",
      "label": "Field Label",
      "type": "text|email|textarea|number|date|select|radio|checkbox|tel|url|file",
      "required": true|false,
      "placeholder": "helpful placeholder",
      "helpText": "optional guidance",
      "options": ["if select/radio/checkbox"]
    }
  ]
}`;
  } else if (analysis.contentType === "form_template") {
    // User provided an actual form template
    systemPrompt = `You are a form extraction expert. The user has provided a form template. Extract all the form fields from it.`;
    
    userPrompt = `Extract all form fields from this form template:

"""
${content}
"""

IMPORTANT RULES:
- Look for field labels followed by input indicators (blank lines, _____, checkboxes, etc.)
- Detect field types from context (email, phone, date, etc.)
- Identify required fields (look for asterisks, "required" text, etc.)
- Extract checkbox/radio options
- Do NOT create fields from headers, instructions, or general text

Return ONLY valid JSON:
{
  "title": "Extracted Form Title",
  "fields": [
    {
      "id": "unique_id",
      "label": "Field Label",
      "type": "text|email|textarea|number|date|select|radio|checkbox|tel|url|file",
      "required": true|false,
      "placeholder": "helpful placeholder",
      "helpText": "optional guidance",
      "options": ["if select/radio/checkbox"]
    }
  ]
}`;
  }

  const response = await getAICompletion({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.2,
    maxTokens: 3000,
    responseFormat: "json",
  });

  const responseContent = response.content.trim() || "{}";
  
  try {
    const result = JSON.parse(responseContent);
    
    // Validate that we have fields
    if (!result.fields || !Array.isArray(result.fields) || result.fields.length === 0) {
      throw new FormImportError(
        "No valid form fields could be extracted from this content. Please ensure the file contains clear field information.",
        422
      );
    }
    
    return {
      title: result.title || "Imported Form",
      fields: result.fields,
    };
  } catch (error) {
    console.error("Failed to parse form generation result:", error);
    throw new FormImportError(
      "Failed to generate form from this content. Please ensure the file contains valid form data.",
      422
    );
  }
}

// Use AI to enhance and validate fields
async function enhanceFieldsWithAI(
  fields: Partial<Field>[],
  fileType: string
): Promise<{ title: string; fields: Field[] }> {
  const prompt = `You are a form design expert. Enhance and validate the following form fields extracted from a ${fileType} file.

Original fields:
${JSON.stringify(fields, null, 2)}

Tasks:
1. Add missing field properties (id, type, required, etc.)
2. Suggest appropriate field types if not specified
3. Add helpful placeholders where appropriate
4. Suggest a descriptive form title based on the fields
5. Ensure all fields have unique IDs in snake_case format

Return valid JSON only with this structure:
{
  "title": "Form Title",
  "fields": [
    {
      "id": "field_id",
      "label": "Field Label",
      "type": "text|email|number|date|select|radio|checkbox|textarea|tel|url",
      "required": true|false,
      "placeholder": "Optional placeholder",
      "options": ["option1", "option2"] // Only for select/radio/checkbox
    }
  ]
}`;

  const response = await getAICompletion({
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    maxTokens: 2048,
    responseFormat: "json",
  });

  const content = response.content.trim() || "";
  
  // Clean up potential markdown code blocks
  let jsonStr = content;
  if (content.includes("```json")) {
    jsonStr = content.split("```json")[1].split("```")[0].trim();
  } else if (content.includes("```")) {
    jsonStr = content.split("```")[1].split("```")[0].trim();
  }

  // Additional cleanup for common AI issues
  jsonStr = jsonStr
    .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
    .replace(/\n/g, ' ') // Replace newlines with spaces to avoid string issues
    .trim();

  try {
    const result = JSON.parse(jsonStr);
    return result;
  } catch (parseError) {
    console.error("JSON Parse Error:", parseError);
    console.error("Content that failed to parse:", jsonStr);
    
    // Try to fix common issues and parse again
    try {
      // Remove any control characters
      const cleaned = jsonStr.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
      const result = JSON.parse(cleaned);
      return result;
    } catch {
      // If still failing, return a basic structure using original fields
      console.error("Second parse attempt failed, returning basic structure");
      return {
        title: "Imported Form",
        fields: fields.map((f, i) => ({
          id: f.id || `field_${i + 1}`,
          label: f.label || `Field ${i + 1}`,
          type: (f.type as Field["type"]) || "text",
          required: f.required || false,
          placeholder: f.placeholder || "",
          options: f.options || [],
        })),
      };
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Read file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const content = buffer.toString("utf-8");

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 });
    }

    // Determine file type
    const fileName = file.name.toLowerCase();
    let parsedData: { title?: string; fields: Partial<Field>[] } | null = null;
    let fileType = "unknown";
    let useIntelligentParsing = false;

    // Handle different file types
    if (fileName.endsWith(".csv")) {
      fileType = "CSV";
      try {
        parsedData = parseCSV(content);
      } catch (csvError) {
        console.log("CSV parsing failed, will use intelligent parsing:", csvError);
        useIntelligentParsing = true;
      }
    } else if (fileName.endsWith(".json")) {
      fileType = "JSON";
      try {
        parsedData = parseJSON(content);
      } catch (jsonError) {
        console.log("JSON parsing failed, will use intelligent parsing:", jsonError);
        useIntelligentParsing = true;
      }
    } else if (fileName.endsWith(".txt") || fileName.endsWith(".md")) {
      fileType = fileName.endsWith(".md") ? "markdown" : "text";
      // Text files always use intelligent parsing
      useIntelligentParsing = true;
    } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      return NextResponse.json(
        { error: "Excel files not yet supported. Please export as CSV and try again." },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload CSV, JSON, TXT, or MD files." },
        { status: 400 }
      );
    }

    let finalData: { title: string; fields: Field[] };

    // If we have successfully parsed structured data (CSV/JSON), enhance it with AI
    if (parsedData && !useIntelligentParsing) {
      try {
        finalData = await enhanceFieldsWithAI(parsedData.fields, fileType);
        finalData.title = finalData.title || parsedData.title || "Imported Form";
      } catch (aiError) {
        console.error("AI enhancement failed:", aiError);
        // Fallback to basic structure if AI fails
        finalData = {
          title: parsedData.title || "Imported Form",
          fields: parsedData.fields.map((f, i) => ({
            id: f.id || `field_${i + 1}`,
            label: f.label || `Field ${i + 1}`,
            type: (f.type as Field["type"]) || "text",
            required: f.required || false,
            placeholder: f.placeholder || "",
            options: f.options || [],
            helpText: f.helpText,
          })),
        };
      }
    } else {
      // Use intelligent parsing for text files or when structured parsing failed
      console.log("Using intelligent content analysis for", fileType);
      
      // First, analyze the content
      const analysis = await analyzeContent(content, fileType);
      console.log("Content analysis:", analysis);
      
      // Then parse based on the analysis
      try {
        const intelligentResult = await parseContentIntelligently(content, analysis, fileType);
        finalData = {
          title: intelligentResult.title,
          fields: intelligentResult.fields.map((f, i) => ({
            id: f.id || `field_${i + 1}`,
            label: f.label || `Field ${i + 1}`,
            type: (f.type as Field["type"]) || "text",
            required: f.required || false,
            placeholder: f.placeholder || "",
            options: f.options || [],
            helpText: f.helpText,
          })),
        };
      } catch (parseError) {
        // If intelligent parsing also fails, return a user-facing error
        if (parseError instanceof FormImportError) {
          throw parseError;
        }

        console.error("Intelligent parsing failed:", parseError);
        throw new FormImportError(
          "We couldn't understand this content well enough to build a form. Please upload a clearer form template or description.",
          422
        );
      }
    }

    return NextResponse.json({
      title: finalData.title,
      fields: finalData.fields,
    });
  } catch (error) {
    console.error("File import error:", error);

    if (error instanceof FormImportError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    const errorMessage = error instanceof Error ? error.message : "Failed to process file";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
