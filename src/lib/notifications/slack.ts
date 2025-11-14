import { SubmissionData } from "./index";
import { SlackNotificationConfig } from "@/types/form";

export async function sendSlackNotification(
  config: SlackNotificationConfig,
  data: SubmissionData
): Promise<void> {
  if (!config.enabled || !config.webhookUrl) {
    return;
  }

  // Validate webhook URL
  if (!config.webhookUrl.startsWith("https://hooks.slack.com/")) {
    throw new Error("Invalid Slack webhook URL. Must start with https://hooks.slack.com/");
  }

  // Format fields for Slack message
  const fieldsText = data.fields
    .map((field) => `*${field.label}:*\n${field.value || "_No response_"}`)
    .join("\n\n");

  // Format files section
  const filesText =
    data.files && data.files.length > 0
      ? `\n\n*Attached Files:*\n${data.files
          .map((file) => `• ${file.fieldLabel}: <${file.downloadUrl}|${file.filename}>`)
          .join("\n")}`
      : "";

  // Build Slack message payload
  const payload = {
    text: `New form submission: ${data.formTitle}`,
    username: config.username || "Form Builder",
    icon_emoji: config.iconEmoji || ":incoming_envelope:",
    channel: config.channel,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `📋 New Form Submission`,
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Form:*\n${data.formTitle}`,
          },
          {
            type: "mrkdwn",
            text: `*Submission ID:*\n${data.submissionId}`,
          },
          {
            type: "mrkdwn",
            text: `*Submitted:*\n${data.timestamp}`,
          },
        ],
      },
      ...(data.customMessage || config.customMessage
        ? [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*Custom Message:*\n${data.customMessage || config.customMessage}`,
              },
            },
          ]
        : []),
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Submission Data:*\n\n${fieldsText}${filesText}`,
        },
      },
      {
        type: "divider",
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "This is an automated notification from your form builder.",
          },
        ],
      },
    ],
  };

  // Send to Slack webhook
  const response = await fetch(config.webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Slack webhook error: ${response.status} ${errorText}`);
  }

  console.log("✓ Slack notification sent successfully");
}

