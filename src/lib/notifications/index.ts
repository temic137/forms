// Centralized notification service
// Only email notifications are supported

import { sendEmailNotification } from "./email";
import { NotificationConfig } from "@/types/form";

export interface SubmissionData {
  formTitle: string;
  submissionId: string;
  timestamp: string;
  fields: Array<{ label: string; value: string; type: string }>;
  files?: Array<{ fieldLabel: string; filename: string; downloadUrl: string }>;
  customMessage?: string;
}

export interface NotificationResult {
  type: string;
  success: boolean;
  error?: string;
}

/**
 * Send notifications to all enabled channels
 */
export async function sendNotifications(
  config: NotificationConfig | null,
  data: SubmissionData,
  formId?: string
): Promise<NotificationResult[]> {
  const results: NotificationResult[] = [];

  if (!config?.enabled) {
    return results;
  }

  // Handle legacy email config (migrate to new format)
  const emailConfig = config.email || (config.recipients && config.recipients.length > 0
    ? {
        enabled: true,
        recipients: config.recipients,
        includeSubmissionData: config.includeSubmissionData ?? true,
        customMessage: config.customMessage,
      }
    : null);

  // Use custom message from email config or top-level config
  const customMessage = emailConfig?.customMessage || config.customMessage || data.customMessage;
  const notificationDataWithMessage = {
    ...data,
    customMessage,
  };

  // Send email notifications
  if (emailConfig?.enabled && emailConfig.recipients.length > 0) {
    try {
      await sendEmailNotification(emailConfig, notificationDataWithMessage, formId);
      results.push({ type: "email", success: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Email notification failed:", errorMessage);
      results.push({ type: "email", success: false, error: errorMessage });
    }
  }

  // Other notification types (Slack, Discord, Webhook) are disabled
  // Only email notifications are supported

  return results;
}

