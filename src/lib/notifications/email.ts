import { resend, generateSubmissionEmailHtml } from "@/lib/resend";
import { SubmissionData } from "./index";
import { EmailNotificationConfig } from "@/types/form";

// Simple in-memory rate limiting cache (in production, use Redis or database)
const notificationCache = new Map<string, { lastSent: Date; count: number }>();

function shouldSendNotification(formId: string, config: EmailNotificationConfig): boolean {
  if (!config.frequency || config.frequency === "immediate") {
    return true;
  }

  const cacheKey = `form_${formId}`;
  const now = new Date();
  const cached = notificationCache.get(cacheKey);

  if (!cached) {
    notificationCache.set(cacheKey, { lastSent: now, count: 1 });
    return true;
  }

  const timeDiff = now.getTime() - cached.lastSent.getTime();
  let shouldSend = false;

  switch (config.frequency) {
    case "hourly":
      shouldSend = timeDiff >= 60 * 60 * 1000; // 1 hour
      break;
    case "daily":
      shouldSend = timeDiff >= 24 * 60 * 60 * 1000; // 24 hours
      break;
    case "weekly":
      shouldSend = timeDiff >= 7 * 24 * 60 * 60 * 1000; // 7 days
      break;
  }

  if (shouldSend) {
    notificationCache.set(cacheKey, { lastSent: now, count: 1 });
    return true;
  }

  // Check batch size limit
  if (config.batchSize && cached.count >= config.batchSize) {
    // Force send if batch size limit reached
    notificationCache.set(cacheKey, { lastSent: now, count: 1 });
    return true;
  }

  // Increment count for batched notifications
  cached.count += 1;
  notificationCache.set(cacheKey, cached);
  return false;
}

export async function sendEmailNotification(
  config: EmailNotificationConfig,
  data: SubmissionData,
  formId?: string
): Promise<void> {
  if (!config.enabled || config.recipients.length === 0) {
    return;
  }

  // Check rate limiting for batched notifications
  if (formId && !shouldSendNotification(formId, config)) {
    console.log(`Notification skipped for form ${formId} due to rate limiting (${config.frequency})`);
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

