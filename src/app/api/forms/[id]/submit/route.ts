import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Field, NotificationConfig } from "@/types/form";
import { addRowToSheet, formatSubmissionForSheet, GoogleSheetsConfig } from "@/lib/google-sheets";
import { sendNotifications, SubmissionData } from "@/lib/notifications";

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
    
    // Send notifications to all enabled channels
    const notificationConfig = form.notifications as NotificationConfig | null;
    if (notificationConfig?.enabled) {
      try {
        // Format submission data for notifications
        const formattedFields = fields.map((field) => ({
          label: field.label,
          value: String(body[field.id] || ""),
          type: field.type,
        }));

        // Format file attachments for notifications
        const formattedFiles = submissionWithFiles?.files.map((file) => {
          const field = fields.find((f) => f.id === file.fieldId);
          return {
            fieldLabel: field?.label || "File",
            filename: file.originalName,
            downloadUrl: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}${file.path}`,
          };
        }) || [];

        // Prepare notification data
        const notificationData: SubmissionData = {
          formTitle: form.title,
          submissionId: submission.id,
          timestamp: new Date().toLocaleString(),
          fields: formattedFields,
          files: formattedFiles.length > 0 ? formattedFiles : undefined,
          customMessage: notificationConfig.customMessage,
        };

        // Send notifications to all enabled channels
        const results = await sendNotifications(notificationConfig, notificationData);
        
        // Log results
        const successful = results.filter((r) => r.success);
        const failed = results.filter((r) => !r.success);
        
        if (successful.length > 0) {
          console.log(`✓ Notifications sent: ${successful.map((r) => r.type).join(", ")}`);
        }
        if (failed.length > 0) {
          console.error(`✗ Notification failures: ${failed.map((r) => `${r.type}: ${r.error}`).join(", ")}`);
        }
      } catch (notificationError) {
        // Log error but don't fail the submission
        console.error("Failed to send notifications:", notificationError);
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


