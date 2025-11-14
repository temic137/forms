import { resend, generateSubmissionEmailHtml } from "@/lib/resend";
import { SubmissionData } from "./index";
import { EmailNotificationConfig } from "@/types/form";

export async function sendEmailNotification(
  config: EmailNotificationConfig,
  data: SubmissionData
): Promise<void> {
  if (!config.enabled || config.recipients.length === 0) {
    return;
  }

  // Check if Resend API key is configured
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("RESEND_API_KEY is not configured. Please add it to your environment variables.");
  }

  // Generate email HTML
  const emailHtml = generateSubmissionEmailHtml({
    formTitle: data.formTitle,
    submissionId: data.submissionId,
    timestamp: data.timestamp,
    fields: data.fields,
    files: data.files,
    customMessage: config.customMessage || data.customMessage,
  });

  // Send email to all recipients
  const result = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "Form Builder <onboarding@resend.dev>",
    to: config.recipients,
    subject: `New submission: ${data.formTitle}`,
    html: emailHtml,
  });

  if (result.error) {
    throw new Error(`Resend API error: ${result.error.message}`);
  }

  console.log(`✓ Email notification sent to ${config.recipients.length} recipient(s)`);
}

