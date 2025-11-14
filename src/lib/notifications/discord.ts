import { SubmissionData } from "./index";
import { DiscordNotificationConfig } from "@/types/form";

export async function sendDiscordNotification(
  config: DiscordNotificationConfig,
  data: SubmissionData
): Promise<void> {
  if (!config.enabled || !config.webhookUrl) {
    return;
  }

  // Validate webhook URL
  if (!config.webhookUrl.startsWith("https://discord.com/api/webhooks/")) {
    throw new Error("Invalid Discord webhook URL. Must start with https://discord.com/api/webhooks/");
  }

  // Format fields for Discord embed
  const fields = data.fields.map((field) => ({
    name: field.label,
    value: field.value || "_No response_",
    inline: false,
  }));

  // Add file information if present
  if (data.files && data.files.length > 0) {
    fields.push({
      name: "📎 Attached Files",
      value: data.files.map((file) => `[${file.filename}](${file.downloadUrl})`).join("\n"),
      inline: false,
    });
  }

  // Build Discord webhook payload
  const payload = {
    username: config.username || "Form Builder",
    avatar_url: config.avatarUrl,
    embeds: [
      {
        title: `📋 New Form Submission: ${data.formTitle}`,
        color: 0x3b82f6, // Blue color
        fields: [
          {
            name: "Submission ID",
            value: data.submissionId,
            inline: true,
          },
          {
            name: "Submitted",
            value: data.timestamp,
            inline: true,
          },
          ...(data.customMessage
            ? [
                {
                  name: "Custom Message",
                  value: data.customMessage,
                  inline: false,
                },
              ]
            : []),
          ...fields,
        ],
        footer: {
          text: "Form Builder Notification",
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  // Send to Discord webhook
  const response = await fetch(config.webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Discord webhook error: ${response.status} ${errorText}`);
  }

  console.log("✓ Discord notification sent successfully");
}

