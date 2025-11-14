import { Resend } from "resend";

// Initialize Resend client with API key from environment variables
export const resend = new Resend(process.env.RESEND_API_KEY);

// Email template for form submission notifications
export function generateSubmissionEmailHtml(data: {
  formTitle: string;
  submissionId: string;
  timestamp: string;
  fields: Array<{ label: string; value: string; type: string }>;
  files?: Array<{ fieldLabel: string; filename: string; downloadUrl: string }>;
  customMessage?: string;
}): string {
  const { formTitle, submissionId, timestamp, fields, files, customMessage } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Form Submission</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    h1 {
      margin: 0;
      color: #1f2937;
      font-size: 24px;
    }
    .meta {
      color: #6b7280;
      font-size: 14px;
      margin-top: 10px;
    }
    .custom-message {
      background-color: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .field-group {
      margin-bottom: 25px;
      padding-bottom: 20px;
      border-bottom: 1px solid #e5e7eb;
    }
    .field-group:last-child {
      border-bottom: none;
    }
    .field-label {
      font-weight: 600;
      color: #374151;
      margin-bottom: 8px;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .field-value {
      color: #1f2937;
      font-size: 16px;
      word-wrap: break-word;
    }
    .files-section {
      background-color: #f9fafb;
      border-radius: 6px;
      padding: 20px;
      margin-top: 30px;
    }
    .files-section h2 {
      margin: 0 0 15px 0;
      font-size: 18px;
      color: #1f2937;
    }
    .file-item {
      background-color: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      padding: 12px;
      margin-bottom: 10px;
    }
    .file-item:last-child {
      margin-bottom: 0;
    }
    .file-label {
      font-weight: 600;
      color: #6b7280;
      font-size: 12px;
      margin-bottom: 5px;
    }
    .file-name {
      color: #1f2937;
      margin-bottom: 8px;
    }
    .download-link {
      display: inline-block;
      background-color: #3b82f6;
      color: #ffffff;
      text-decoration: none;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
    }
    .download-link:hover {
      background-color: #2563eb;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 12px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 New Form Submission</h1>
      <div class="meta">
        <strong>Form:</strong> ${formTitle}<br>
        <strong>Submission ID:</strong> ${submissionId}<br>
        <strong>Submitted:</strong> ${timestamp}
      </div>
    </div>

    ${customMessage ? `
    <div class="custom-message">
      <strong>Message:</strong><br>
      ${customMessage}
    </div>
    ` : ''}

    <div class="fields">
      ${fields.map(field => `
        <div class="field-group">
          <div class="field-label">${field.label}</div>
          <div class="field-value">${field.value || '<em>No response</em>'}</div>
        </div>
      `).join('')}
    </div>

    ${files && files.length > 0 ? `
    <div class="files-section">
      <h2>📎 Attached Files</h2>
      ${files.map(file => `
        <div class="file-item">
          <div class="file-label">${file.fieldLabel}</div>
          <div class="file-name">${file.filename}</div>
          <a href="${file.downloadUrl}" class="download-link">Download File</a>
        </div>
      `).join('')}
      <div style="margin-top: 15px; font-size: 12px; color: #6b7280;">
        <em>Note: Download links expire in 7 days</em>
      </div>
    </div>
    ` : ''}

    <div class="footer">
      This is an automated notification from your form builder.<br>
      Please do not reply to this email.
    </div>
  </div>
</body>
</html>
  `.trim();
}
