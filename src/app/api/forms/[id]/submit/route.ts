import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Field, NotificationConfig, QuizModeConfig } from "@/types/form";
import { addRowToSheet, formatSubmissionForSheet, GoogleSheetsConfig } from "@/lib/google-sheets";
import { sendNotifications, SubmissionData } from "@/lib/notifications";
import { calculateQuizScore } from "@/lib/scoring";
import { resend, generateEditLinkEmailHtml } from "@/lib/resend";
import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";

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
        notifications: true,
        quizMode: true,
        limitOneResponse: true,
        saveAndEdit: true,
      } 
    });
    if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });

    // Extract file metadata and respondentId if present
    const fileMetadata: FileMetadata[] = body._fileMetadata || [];
    const respondentId = body.respondentId;
    
    delete body._fileMetadata; // Remove metadata from answers
    delete body.respondentId; // Remove respondentId from answers

    // Check for previous submission if limited
    if (form.limitOneResponse && respondentId) {
      const existingSubmission = await prisma.submission.findFirst({
        where: {
          formId,
          respondentId: String(respondentId),
        },
      });

      if (existingSubmission) {
        return NextResponse.json(
          { error: "You have already responded to this form." },
          { status: 403 }
        );
      }
    }

    // Get form fields and quiz mode for scoring
    const fields = form.fieldsJson as unknown as Field[];
    const quizModeConfig = form.quizMode as QuizModeConfig | null;

    // Calculate quiz score if quiz mode is enabled
    const quizScore = quizModeConfig ? calculateQuizScore(fields, body, quizModeConfig) : null;

    // Handle Edit Link logic
    let editToken: string | null = null;
    let respondentEmail: string | null = null;

    if (form.saveAndEdit) {
      editToken = randomUUID();
      
      // Attempt to find email in submission
      const emailField = fields.find(f => f.type === 'email');
      if (emailField && body[emailField.id]) {
        respondentEmail = String(body[emailField.id]);
      } else {
        // Fallback: search for keys containing 'email'
        const emailKey = Object.keys(body).find(k => k.toLowerCase().includes('email'));
        if (emailKey) {
          respondentEmail = String(body[emailKey]);
        }
      }

      // Send edit link if email found
      if (respondentEmail && respondentEmail.includes('@')) {
        try {
           const editLink = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/f/${formId}/edit?token=${editToken}`;
           await resend.emails.send({
               from: process.env.RESEND_FROM_EMAIL || "Form Builder <onboarding@resend.dev>",
               to: respondentEmail,
               subject: `Edit your response: ${form.title}`,
               html: generateEditLinkEmailHtml(form.title, editLink),
           });
           console.log(`✓ Edit link sent to ${respondentEmail}`);
        } catch (e) {
           console.error("Failed to send edit link:", e);
           // Continue without failing submission
        }
      }
    }

    // Create submission with score
    const submission = await prisma.submission.create({
      data: { 
        formId, 
        answersJson: body,
        score: quizScore ? (quizScore as unknown as Prisma.InputJsonValue) : undefined,
        respondentId: respondentId ? String(respondentId) : null,
        editToken: editToken,
        respondentEmail: respondentEmail,
      },
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
        const results = await sendNotifications(notificationConfig, notificationData, formId);
        
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
      score: quizScore,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: formId } = await context.params;
    const body = await req.json();
    const { editToken, ...answers } = body;

    if (!editToken) {
      return NextResponse.json({ error: "Missing edit token" }, { status: 400 });
    }

    // Verify token and get existing submission
    const submission = await prisma.submission.findUnique({
      where: { editToken: String(editToken) },
    });

    if (!submission || submission.formId !== formId) {
      return NextResponse.json({ error: "Invalid edit token" }, { status: 403 });
    }

    // Get form for quiz scoring (if applicable)
    const form = await prisma.form.findUnique({ 
      where: { id: formId }, 
      select: { 
        fieldsJson: true, 
        quizMode: true 
      } 
    });

    let quizScore = null;
    if (form) {
      const fields = form.fieldsJson as unknown as Field[];
      const quizModeConfig = form.quizMode as QuizModeConfig | null;
      quizScore = quizModeConfig ? calculateQuizScore(fields, answers, quizModeConfig) : null;
    }

    // Update submission
    await prisma.submission.update({
      where: { id: submission.id },
      data: {
        answersJson: answers,
        score: quizScore ? (quizScore as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to update submission";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}


