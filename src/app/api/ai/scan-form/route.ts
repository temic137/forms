import { NextRequest, NextResponse } from "next/server";
import { getGroqClient } from "@/lib/groq";

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

// Mock OCR function - in production, you'd use a service like:
// - Google Cloud Vision API
// - AWS Textract
// - Azure Computer Vision
// - Tesseract.js (client-side OCR)
async function performOCR(_file: File): Promise<string> {
  // For demonstration, we'll simulate OCR
  // In production, implement actual OCR integration
  
  // Simulate extracted text from a form
  const mockExtractedText = `
    CONTACT FORM
    
    Full Name: _______________
    Email Address: _______________
    Phone Number: _______________
    
    Subject: _______________
    
    Message:
    _____________________________
    _____________________________
    _____________________________
    
    Preferred Contact Method:
    [ ] Email
    [ ] Phone
    [ ] SMS
    
    Subscribe to newsletter: [ ]
  `;
  
  return mockExtractedText;
}

// Use AI to analyze OCR text and generate form structure
async function analyzeFormStructure(extractedText: string): Promise<{ title: string; fields: Field[] }> {
  const groq = getGroqClient();

  const prompt = `You are an expert form analyst. Analyze the following text extracted from a scanned document (via OCR) and determine if it contains a form.

Extracted Text:
${extractedText}

CRITICAL RULES:
1. ONLY extract fields if this is clearly an ACTUAL FORM with field labels and input areas
2. Look for indicators of form fields:
   - Blank lines (___), underscores for input
   - Checkboxes [ ] or radio buttons ( )
   - Field labels followed by colons or input spaces
   - Form structure with clear input areas

3. DO NOT create fields from:
   - General text content, articles, or documentation
   - Marketing copy or descriptions
   - Instructions or explanatory text
   - Table of contents or navigation
   - Headers and footers

4. If this is NOT a form but general content, return an error

Your task IF IT'S A FORM:
1. Identify all form fields (labels, input types, etc.)
2. Determine appropriate field types based on context
3. Detect any checkbox/radio options
4. Identify required vs optional fields (look for asterisks or "required" text)
5. Create a descriptive form title
6. Add helpful placeholders

Return ONLY valid JSON:
{
  "isForm": true|false,
  "title": "Extracted Form Title",
  "fields": [
    {
      "id": "field_id_in_snake_case",
      "label": "Field Label",
      "type": "text|email|number|date|select|radio|checkbox|textarea|tel|url|file",
      "required": true|false,
      "placeholder": "Optional helpful placeholder",
      "helpText": "Optional guidance text",
      "options": ["option1", "option2"]
    }
  ]
}

Guidelines for field extraction:
- Blank lines (___) or underscores indicate input fields
- Multiple checkboxes/radio buttons → checkbox or radio field with options
- Large text areas with multiple lines → "textarea" type
- Context clues: "email" → email type, "phone/tel" → tel type, "date/birthday" → date type
- Common patterns: "First Name" and "Last Name" are separate text fields
- Address fields: Street, City, State, ZIP are separate fields
- Single agree/subscribe checkboxes → checkbox field`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
    max_tokens: 3000,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content?.trim() || "";
  
  try {
    const result = JSON.parse(content);
    
    // Check if it's actually a form
    if (result.isForm === false) {
      throw new Error(
        "This document does not appear to contain a form. " +
        "Please scan an actual form document with labeled fields and input areas."
      );
    }
    
    // Validate that we have fields
    if (!result.fields || !Array.isArray(result.fields) || result.fields.length === 0) {
      throw new Error(
        "No form fields could be detected in this document. " +
        "Please ensure the document is clear and contains visible form fields."
      );
    }
    
    return {
      title: result.title || "Scanned Form",
      fields: result.fields,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("does not appear to contain a form")) {
      throw error;
    }
    console.error("Failed to parse form structure:", error);
    throw new Error("Failed to analyze the scanned document. Please ensure it contains a clear form structure.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload an image or PDF." },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Perform OCR
    const extractedText = await performOCR(file);

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: "Could not extract text from the document. Please ensure the image is clear." },
        { status: 400 }
      );
    }

    // Analyze form structure using AI
    const formData_ = await analyzeFormStructure(extractedText);

    return NextResponse.json({
      title: formData_.title || "Scanned Form",
      fields: formData_.fields,
      extractedText, // Include for debugging (remove in production)
    });
  } catch (error) {
    console.error("Document scan error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process document" },
      { status: 500 }
    );
  }
}
