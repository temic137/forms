import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Lazy load pdf-parse to avoid build-time issues with canvas
async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import to avoid build-time canvas dependency issues
    const pdfParse = await import("pdf-parse");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdf = (pdfParse as any).default || pdfParse;
    const data = await pdf(buffer);
    return data.text;
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error("Failed to parse PDF file");
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text = "";

    if (file.type === "application/pdf") {
      text = await parsePdf(buffer);
    } else if (
      file.type === "text/plain" ||
      file.type === "text/csv" ||
      file.type === "application/json"
    ) {
      text = buffer.toString("utf-8");
    } else if (
      file.type.startsWith("image/")
    ) {
      // Mock OCR for images - reusing the mock text from scan-form to ensure consistent behavior
      // In a real implementation, this would call an OCR service
      text = `
    CONTACT FORM
    
    Full Name: _______________
    Email Address: _______________
    Phone Number: _______________
    
    Subject: _______________
    
    Message:
    _____________________________
    _____________________________
    
    Preferred Contact Method:
    [ ] Email
    [ ] Phone
    
    Subscribe to newsletter: [ ]
      `;
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PDF, TXT, CSV, JSON, or Image." },
        { status: 400 }
      );
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Error parsing file:", error);
    return NextResponse.json(
      { error: "Failed to parse file" },
      { status: 500 }
    );
  }
}
