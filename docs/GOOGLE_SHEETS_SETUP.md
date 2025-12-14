# Google Sheets Integration Setup Guide

The Google Sheets integration is now **super easy** for users! They just need to:
1. Click "Connect Google Account" 
2. Authorize access
3. Paste their Google Sheet URL
4. Enter the sheet name
5. Done! ✨

## For Administrators: OAuth Setup

To enable Google Sheets integration for your users, you need to configure Google OAuth in your Google Cloud Console.

## Step-by-Step OAuth Setup (Admin Only)

### 1. Create a Google Cloud Project (if you don't have one)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Sheets API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

### 2. Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" (unless you have a Google Workspace)
3. Fill in the required information:
   - **App name**: Your app name
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Click "Save and Continue"
5. Add scopes (if not already added):
   - `https://www.googleapis.com/auth/spreadsheets`
   - `https://www.googleapis.com/auth/drive.file`
6. Add test users (if in testing mode) or publish the app
7. Click "Save and Continue" through the remaining steps

### 3. Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application" as the application type
4. Fill in the details:
   - **Name**: e.g., "Forms App OAuth Client"
   - **Authorized redirect URIs**: 
     - For local: `http://localhost:3000/api/integrations/google-sheets/oauth/callback`
     - For production: `https://your-domain.com/api/integrations/google-sheets/oauth/callback`
5. Click "Create"
6. **Copy the Client ID and Client Secret** - you'll need these for environment variables

### 4. Configure Environment Variables

Add these to your `.env.local` (or Vercel environment variables):

```env
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"  # or your production URL
```

**For Vercel/Production:**
- Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to your Vercel environment variables
- Set `NEXT_PUBLIC_BASE_URL` to your production domain

### 5. That's It! 🎉

Once OAuth is configured, users can easily connect their Google Sheets:

1. Users click "Connect Google Account" in the integration settings
2. They authorize your app to access their Google Sheets
3. They paste their Google Sheet URL and sheet name
4. Form submissions automatically sync to their sheets!

**No service accounts needed for users!** Each user connects with their own Google account.

## For Users: How to Connect Google Sheets

Once OAuth is set up by the administrator, connecting Google Sheets is super simple:

1. **Go to your form's dashboard**
2. **Navigate to the "Integrations" section**
3. **Click on "Google Sheets"**
4. **Click "Connect Google Account"** (first time only)
   - You'll be redirected to Google to authorize access
   - Click "Allow" to grant permissions
   - You'll be redirected back to your dashboard
5. **Paste your Google Sheet URL** (or just the spreadsheet ID)
6. **Enter the sheet name** (default: "Form Responses")
7. **Click "Connect Sheet"**

That's it! The integration will:
- ✅ Validate the connection
- ✅ Create the sheet if it doesn't exist
- ✅ Initialize headers automatically
- ✅ Start syncing form submissions

## How It Works

When a form submission is received:

1. The submission is saved to your database (as before)
2. If Google Sheets integration is enabled, the data is automatically synced
3. Headers are created automatically on the first submission (if not already initialized)
4. Each submission becomes a new row in your Google Sheet

## Troubleshooting

### Error: "Permission denied"

**Solution**: Make sure you've shared your Google Sheet with the service account email. Check the `client_email` in your service account JSON and ensure it has "Editor" access to the sheet.

### Error: "Spreadsheet not found"

**Solution**: 
- Verify the Spreadsheet ID is correct
- Make sure the sheet is shared with the service account
- Check that the Spreadsheet ID is extracted correctly from the URL

### Error: "Authentication failed"

**Solution**:
- Verify `GOOGLE_SERVICE_ACCOUNT_JSON` is set correctly in your environment variables
- Make sure the JSON is valid (no syntax errors)
- Ensure the JSON is on a single line in your `.env.local` file
- Restart your development server after adding the environment variable

### Error: "Sheet not found"

**Solution**: 
- The sheet name might be incorrect (check for typos, case sensitivity, and extra spaces)
- The integration will try to create the sheet automatically, but if it fails, create it manually in your spreadsheet

### Data not appearing in Google Sheets

**Check**:
1. Is the integration enabled? (Check the dashboard)
2. Are there any errors in the server logs?
3. Is the service account email shared with the sheet?
4. Try submitting a test form response

## Testing the Integration

1. Set up the integration as described above
2. Submit a test response to your form
3. Check your Google Sheet - you should see:
   - Headers in the first row (Submission ID, Submitted At, and your form fields)
   - A new row with the submission data

## Security Notes

- **Never commit** your service account JSON file to version control
- Keep your service account keys secure
- Only share sheets with the service account that need to be accessed
- Consider using different service accounts for different environments (dev/prod)

## Support

If you continue to experience issues:
1. Check the server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure the Google Sheets API is enabled in your Google Cloud project
4. Double-check that the service account has the correct permissions

