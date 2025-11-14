# Notifications Setup Guide

This guide explains how to set up and configure all notification types for your form builder.

## Overview

The form builder supports multiple notification channels:
- **Email** - Send notifications via Resend
- **Slack** - Send notifications to Slack channels via webhooks
- **Discord** - Send notifications to Discord channels via webhooks
- **Webhook** - Send notifications to any custom webhook endpoint

You can enable multiple notification channels simultaneously. All enabled channels will receive notifications when a form is submitted.

## Email Notifications

### Setup

1. **Get a Resend API Key**
   - Sign up at [resend.com](https://resend.com)
   - Go to API Keys section
   - Create a new API key
   - Copy the API key

2. **Add to Environment Variables**
   ```env
   RESEND_API_KEY=re_your_api_key_here
   RESEND_FROM_EMAIL=Form Builder <noreply@yourdomain.com>
   ```
   > Note: Update `RESEND_FROM_EMAIL` with your verified domain email address

3. **Configure in Form Builder**
   - Go to form settings
   - Enable notifications
   - Switch to the "Email" tab
   - Enable email notifications
   - Add recipient email addresses
   - Optionally add a custom message

### Testing

1. Create a test form
2. Enable email notifications with your email address
3. Submit the form
4. Check your inbox (and spam folder)

## Slack Notifications

### Setup

1. **Create a Slack Webhook**
   - Go to your Slack workspace
   - Navigate to: https://api.slack.com/apps
   - Click "Create New App" → "From scratch"
   - Name your app (e.g., "Form Builder")
   - Select your workspace
   - Go to "Incoming Webhooks" in the left sidebar
   - Toggle "Activate Incoming Webhooks" to ON
   - Click "Add New Webhook to Workspace"
   - Select the channel where you want notifications
   - Copy the webhook URL (starts with `https://hooks.slack.com/services/...`)

2. **Configure in Form Builder**
   - Go to form settings
   - Enable notifications
   - Switch to the "Slack" tab
   - Enable Slack notifications
   - Paste your webhook URL
   - Optionally set:
     - Channel name (e.g., `#general`)
     - Username (default: "Form Builder")
     - Icon emoji (default: `:incoming_envelope:`)

### Testing

1. Create a test form
2. Enable Slack notifications with your webhook URL
3. Submit the form
4. Check your Slack channel

## Discord Notifications

### Setup

1. **Create a Discord Webhook**
   - Open your Discord server
   - Go to Server Settings → Integrations → Webhooks
   - Click "New Webhook"
   - Name your webhook (e.g., "Form Builder")
   - Select the channel where you want notifications
   - Click "Copy Webhook URL"
   - The URL should start with `https://discord.com/api/webhooks/...`

2. **Configure in Form Builder**
   - Go to form settings
   - Enable notifications
   - Switch to the "Discord" tab
   - Enable Discord notifications
   - Paste your webhook URL
   - Optionally set:
     - Username (default: "Form Builder")
     - Avatar URL (optional)

### Testing

1. Create a test form
2. Enable Discord notifications with your webhook URL
3. Submit the form
4. Check your Discord channel

## Webhook Notifications

### Setup

1. **Create Your Webhook Endpoint**
   - Set up an HTTP endpoint that accepts POST requests
   - The endpoint should accept JSON payloads
   - Optionally implement HMAC signature verification for security

2. **Webhook Payload Format**
   ```json
   {
     "event": "form.submission",
     "timestamp": "2024-01-15T10:30:00.000Z",
     "form": {
       "title": "Contact Form"
     },
     "submission": {
       "id": "sub_123",
       "timestamp": "1/15/2024, 10:30:00 AM",
       "fields": [
         {
           "label": "Name",
           "value": "John Doe",
           "type": "short-answer"
         }
       ],
       "files": [
         {
           "fieldLabel": "Resume",
           "filename": "resume.pdf",
           "downloadUrl": "https://..."
         }
       ],
       "customMessage": "Optional custom message"
     }
   }
   ```

3. **HMAC Signature (Optional)**
   - If you provide a secret key, the webhook will include an `X-Webhook-Signature` header
   - Format: `sha256=<signature>`
   - Verify the signature using HMAC-SHA256 with your secret key

4. **Configure in Form Builder**
   - Go to form settings
   - Enable notifications
   - Switch to the "Webhook" tab
   - Enable webhook notifications
   - Enter your webhook URL
   - Select HTTP method (POST, PUT, or PATCH)
   - Optionally add a secret key for HMAC signature

### Testing

1. Use a service like [webhook.site](https://webhook.site) to get a test endpoint
2. Create a test form
3. Enable webhook notifications with your test URL
4. Submit the form
5. Check the webhook.site page to see the received payload

## Troubleshooting

### Email Notifications Not Working

- **Check RESEND_API_KEY**: Make sure it's set in your environment variables
- **Verify email address**: Ensure the "from" email uses a verified domain
- **Check spam folder**: Notifications might be filtered
- **Check server logs**: Look for error messages in your deployment logs

### Slack/Discord Notifications Not Working

- **Verify webhook URL**: Make sure the URL is correct and active
- **Check webhook status**: In Slack/Discord, verify the webhook hasn't been deleted
- **Test webhook manually**: Use curl or Postman to test the webhook directly
- **Check server logs**: Look for error messages in your deployment logs

### Webhook Notifications Not Working

- **Verify endpoint is accessible**: Make sure your endpoint is publicly accessible
- **Check HTTP method**: Ensure your endpoint accepts the configured method (POST/PUT/PATCH)
- **Verify payload format**: Check that your endpoint can handle the JSON payload
- **Check server logs**: Look for error messages in your deployment logs
- **Test with webhook.site**: Use a test service to verify the webhook is being called

## Best Practices

1. **Multiple Channels**: Enable multiple notification channels for redundancy
2. **Error Handling**: Notifications are sent asynchronously and won't fail form submissions
3. **Security**: Use HMAC signatures for webhooks when possible
4. **Testing**: Always test notifications with a test form before going live
5. **Monitoring**: Monitor server logs to catch notification failures early

## Environment Variables Summary

```env
# Email (Required for email notifications)
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=Form Builder <noreply@yourdomain.com>

# Base URL (Required for file download links in notifications)
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
```

## Support

If you encounter issues:
1. Check the server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test each notification channel individually
4. Ensure your webhook endpoints are accessible and working

