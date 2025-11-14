import { SubmissionData } from "./index";
import { WebhookNotificationConfig } from "@/types/form";

export async function sendWebhookNotification(
  config: WebhookNotificationConfig,
  data: SubmissionData
): Promise<void> {
  if (!config.enabled || !config.url) {
    return;
  }

  // Validate URL
  try {
    new URL(config.url);
  } catch {
    throw new Error("Invalid webhook URL");
  }

  const method = config.method || "POST";

  // Build payload
  const payload = {
    event: "form.submission",
    timestamp: new Date().toISOString(),
    form: {
      title: data.formTitle,
    },
    submission: {
      id: data.submissionId,
      timestamp: data.timestamp,
      fields: data.fields,
      files: data.files,
      customMessage: data.customMessage,
    },
  };

  // Build headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "Form-Builder/1.0",
    ...config.headers,
  };

  // Add HMAC signature if secret is provided
  if (config.secret) {
    const crypto = await import("crypto");
    const payloadString = JSON.stringify(payload);
    const signature = crypto
      .createHmac("sha256", config.secret)
      .update(payloadString)
      .digest("hex");
    headers["X-Webhook-Signature"] = `sha256=${signature}`;
  }

  // Send webhook request
  const response = await fetch(config.url, {
    method,
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Webhook error: ${response.status} ${errorText}`);
  }

  console.log(`✓ Webhook notification sent to ${config.url}`);
}

