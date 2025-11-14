import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend, generateSubmissionEmailHtml } from "@/lib/resend";
import { Field, NotificationConfig } from "@/types/form";
import { addRowToSheet, formatSubmissionForSheet, GoogleSheetsConfig } from "@/lib/google-sheets";

interface FileMetadata {
  fieldId: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  url: string;
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: formId } = await context.params;
    const body = await req.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
    }

    // Ensure form exists and get notification config
    const form = await prisma.form.findUnique({ 
      where: { id: formId }, 
      select: { 
        id: true, 
        title: true, 
        fieldsJson: true,
        notifications: true 
      } 
    });
    if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });

    // Extract file metadata if present
    const fileMetadata: FileMetadata[] = body._fileMetadata || [];
    delete body._fileMetadata; // Remove metadata from answers

    // Create submission
    const submission = await prisma.submission.create({
      data: { formId, answersJson: body },
    });

    // Store file metadata in database
    if (fileMetadata.length > 0) {
      const fileRecords = fileMetadata.map((file) => ({
        submissionId: submission.id,
        fieldId: file.fieldId,
        filename: file.filename,
        originalName: file.originalName,
        size: file.size,
        mimeType: file.mimeType,
        path: file.url,
        uploadedAt: new Date(),
      }));

      await prisma.file.createMany({
        data: fileRecords,
      });
    }

    // Fetch the created submission with file references
    const submissionWithFiles = await prisma.submission.findUnique({
      where: { id: submission.id },
      include: { files: true },
    });

    // Get form fields for processing
    const fields = form.fieldsJson as unknown as Field[];
    
    // Send email notification if enabled
    const notificationConfig = form.notifications as NotificationConfig | null;
    if (notificationConfig?.enabled && notificationConfig.recipients.length > 0) {
      try {
        // Format submission data for email
        const formattedFields = fields.map((field) => ({
          label: field.label,
          value: String(body[field.id] || ""),
          type: field.type,
        }));

        // Format file attachments for email
        const formattedFiles = submissionWithFiles?.files.map((file) => {
          const field = fields.find((f) => f.id === file.fieldId);
          return {
            fieldLabel: field?.label || "File",
            filename: file.originalName,
            downloadUrl: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}${file.path}`,
          };
        }) || [];

        // Generate email HTML
        const emailHtml = generateSubmissionEmailHtml({
          formTitle: form.title,
          submissionId: submission.id,
          timestamp: new Date().toLocaleString(),
          fields: formattedFields,
          files: formattedFiles.length > 0 ? formattedFiles : undefined,
          customMessage: notificationConfig.customMessage,
        });

        // Send email to all recipients
        await resend.emails.send({
          from: "Form Builder <onboarding@resend.dev>", // Update with your verified domain
          to: notificationConfig.recipients,
          subject: `New submission: ${form.title}`,
          html: emailHtml,
        });
      } catch (emailError) {
        // Log error but don't fail the submission
        console.error("Failed to send notification email:", emailError);
      }
    }

    // Sync to Google Sheets if enabled
    try {
      const googleSheetsIntegration = await prisma.integration.findFirst({
        where: {
          formId,
          type: "google_sheets",
          enabled: true
        }
      });

      if (googleSheetsIntegration && submissionWithFiles) {
        const config = googleSheetsIntegration.config as unknown as GoogleSheetsConfig;
        const formattedData = formatSubmissionForSheet(
          submissionWithFiles,
          fields.map(f => ({ id: f.id, label: f.label, type: f.type }))
        );
        
        await addRowToSheet(config, formattedData);
        console.log('✓ Synced to Google Sheets');
      }
    } catch (sheetsError) {
      // Log error but don't fail the submission
      console.error("Failed to sync to Google Sheets:", sheetsError);
    }

    return NextResponse.json({ 
      ok: true, 
      submissionId: submission.id,
      files: submissionWithFiles?.files || [],
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}


