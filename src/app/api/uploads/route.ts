import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";

const ACCEPTED_TYPES: Record<string, string[]> = {
  images: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
  documents: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/csv",
  ],
  pdf: ["application/pdf"],
  pdf_image: [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml"
  ],
  all: [], // Empty array means accept all types
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const formId = formData.get("formId") as string | null;
    const submissionId = formData.get("submissionId") as string | null;
    const fieldId = formData.get("fieldId") as string | null;
    const acceptedTypes = (formData.get("acceptedTypes") as string) || "all";
    const maxSizeMB = parseInt((formData.get("maxSizeMB") as string) || "10");

    if (!file || !formId || !submissionId || !fieldId) {
      return NextResponse.json(
        { error: "Missing required fields: file, formId, submissionId, fieldId" },
        { status: 400 }
      );
    }

    // Validate file size
    const maxSize = Math.min(maxSizeMB, 10) * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds maximum of ${maxSizeMB}MB` },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ACCEPTED_TYPES[acceptedTypes as keyof typeof ACCEPTED_TYPES] || [];
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `File type ${file.type} is not accepted` },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split(".").pop() || "";
    const uniqueFilename = `${timestamp}-${randomString}.${extension}`;

    // Upload to Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const folder = `forms/${formId}/${submissionId}`;
    
    const { url } = await uploadToCloudinary(buffer, folder, uniqueFilename);

    // Generate expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 365 * 10); // 10 years expiration

    // Generate file ID
    const fileId = `${formId}-${submissionId}-${fieldId}-${timestamp}`;

    return NextResponse.json({
      fileId,
      filename: uniqueFilename,
      originalName: file.name,
      size: file.size,
      type: file.type,
      url,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("File upload error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to upload file";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
