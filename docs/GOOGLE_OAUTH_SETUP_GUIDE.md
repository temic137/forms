# Complete Google OAuth Setup Guide

This guide will walk you through setting up Google OAuth for Google Sheets integration step-by-step.

## Prerequisites

- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com/)

---

## Step 1: Create or Select a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. If you don't have a project:
   - Click the project dropdown at the top (next to "Google Cloud")
   - Click "New Project"
   - Enter a project name (e.g., "Forms App")
   - Click "Create"
3. If you already have a project, select it from the dropdown

---

## Step 2: Enable Google Sheets API

1. In Google Cloud Console, go to **"APIs & Services"** in the left sidebar
2. Click **"Library"** (or "Enabled APIs & services" then "Enable APIs and Services")
3. In the search bar, type: **"Google Sheets API"**
4. Click on **"Google Sheets API"** from the results
5. Click the blue **"Enable"** button
6. Wait a few seconds for it to enable (you'll see a checkmark when done)

**✅ Done!** Google Sheets API is now enabled.

---

## Step 3: Configure OAuth Consent Screen

1. Still in Google Cloud Console, go to **"APIs & Services"** > **"OAuth consent screen"**
2. You'll see a form to configure your app:

   **User Type:**
   - Choose **"External"** (unless you have Google Workspace)
   - Click **"Create"**

   **App Information:**
   - **App name**: Enter your app name (e.g., "My Forms App")
   - **User support email**: Select your email from dropdown
   - **App logo**: (Optional) Upload a logo if you have one
   - **App domain**: (Optional) Leave blank for now
   - **Application home page**: Your website URL (e.g., `https://yourdomain.com`)
   - **Privacy policy link**: (Optional) Your privacy policy URL
   - **Terms of service link**: (Optional) Your terms of service URL
   - **Authorized domains**: (Optional) Add your domain if you have one
   - **Developer contact information**: Your email address
   
   Click **"Save and Continue"**

3. **Scopes** (Step 2):
   - Click **"Add or Remove Scopes"**
   - In the filter box, search for: `spreadsheets`
   - Check the box for: **`https://www.googleapis.com/auth/spreadsheets`**
   - Search for: `drive.file`
   - Check the box for: **`https://www.googleapis.com/auth/drive.file`**
   - Click **"Update"** at the bottom
   - Click **"Save and Continue"**

4. **Test users** (Step 3 - if app is in Testing mode):
   - Click **"Add Users"**
   - Add your email address (and any other test users)
   - Click **"Add"**
   - Click **"Save and Continue"**

5. **Summary** (Step 4):
   - Review your settings
   - Click **"Back to Dashboard"**

**⚠️ Important:** If your app is in "Testing" mode:
- Only test users you added can use the OAuth flow
- To make it available to everyone, you need to:
  - Go back to "OAuth consent screen"
  - Click "Publish App" button
  - Confirm the publishing

**✅ Done!** OAuth consent screen is configured.

---

## Step 4: Create OAuth Credentials

1. In Google Cloud Console, go to **"APIs & Services"** > **"Credentials"**
2. Click the **"+ CREATE CREDENTIALS"** button at the top
3. Select **"OAuth client ID"** from the dropdown

4. If this is your first time, you might see:
   - **"Configure consent screen"** button - Click it and complete Step 3 above first
   - Then come back to this step

5. **Application type**: Select **"Web application"**

6. **Name**: Give it a name (e.g., "Forms App OAuth Client")

7. **Authorized redirect URIs**: This is critical! Add these URIs:

   **For Local Development:**
   ```
   http://localhost:3000/api/integrations/google-sheets/oauth/callback
   ```

   **For Production (replace with your domain):**
   ```
   https://yourdomain.com/api/integrations/google-sheets/oauth/callback
   ```
   
   **How to add:**
   - Click **"+ ADD URI"**
   - Paste the URI
   - Click **"+ ADD URI"** again for production URI (if different)
   - Make sure there are no trailing slashes

8. Click **"CREATE"**

9. **Important!** A popup will appear with:
   - **Your Client ID** (looks like: `123456789-abc.apps.googleusercontent.com`)
   - **Your Client Secret** (looks like: `GOCSPX-abc123def456...`)

   **⚠️ Copy both of these immediately!** You won't be able to see the secret again.
   - Click the copy icon next to each, or select and copy manually
   - Save them in a secure place (password manager, notes app, etc.)

10. Click **"OK"**

**✅ Done!** OAuth credentials are created.

---

## Step 5: Add Environment Variables

Now you need to add these credentials to your application.

### For Local Development (.env.local)

1. In your project root, create or open `.env.local` file
2. Add these lines (replace with your actual values):

```env
GOOGLE_CLIENT_ID="123456789-abc.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-abc123def456..."
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

**Important:**
- Use double quotes around the values
- No spaces around the `=` sign
- Replace the example values with your actual Client ID and Client Secret
- Make sure `.env.local` is in your `.gitignore` file (don't commit secrets!)

3. Save the file
4. **Restart your development server** if it's running:
   - Stop the server (Ctrl+C)
   - Run `npm run dev` again

### For Vercel/Production

1. Go to your Vercel project dashboard
2. Click on your project
3. Go to **"Settings"** tab
4. Click **"Environment Variables"** in the left sidebar
5. Add each variable:

   **Variable 1:**
   - **Key**: `GOOGLE_CLIENT_ID`
   - **Value**: Your Client ID (e.g., `123456789-abc.apps.googleusercontent.com`)
   - **Environment**: Select all (Production, Preview, Development)
   - Click **"Save"**

   **Variable 2:**
   - **Key**: `GOOGLE_CLIENT_SECRET`
   - **Value**: Your Client Secret (e.g., `GOCSPX-abc123def456...`)
   - **Environment**: Select all (Production, Preview, Development)
   - Click **"Save"**

   **Variable 3:**
   - **Key**: `NEXT_PUBLIC_BASE_URL`
   - **Value**: Your production URL (e.g., `https://yourdomain.com`)
   - **Environment**: Select all (Production, Preview, Development)
   - Click **"Save"**

6. **Redeploy your application** for changes to take effect:
   - Go to "Deployments" tab
   - Click the three dots on the latest deployment
   - Click "Redeploy"

**✅ Done!** Environment variables are configured.

---

## Step 6: Verify Setup

1. **Check your environment variables are loaded:**
   - In your code, you can temporarily log them (but don't commit this!):
   ```javascript
   console.log('Client ID:', process.env.GOOGLE_CLIENT_ID ? 'Set ✓' : 'Missing ✗');
   console.log('Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? 'Set ✓' : 'Missing ✗');
   ```

2. **Test the OAuth flow:**
   - Go to your form dashboard
   - Click on "Integrations" > "Google Sheets"
   - Click "Connect Google Account"
   - You should be redirected to Google's authorization page
   - After authorizing, you should be redirected back

---

## Troubleshooting

### "redirect_uri_mismatch" Error

**Problem:** The redirect URI doesn't match what you configured.

**Solution:**
1. Go back to Google Cloud Console > Credentials
2. Click on your OAuth client
3. Check the "Authorized redirect URIs" section
4. Make sure the URI exactly matches:
   - For local: `http://localhost:3000/api/integrations/google-sheets/oauth/callback`
   - For production: `https://yourdomain.com/api/integrations/google-sheets/oauth/callback`
5. No trailing slashes, exact match required!

### "Access blocked: This app's request is invalid"

**Problem:** OAuth consent screen not configured or app not published.

**Solution:**
1. Go to OAuth consent screen
2. Make sure all required fields are filled
3. If in Testing mode, add your email as a test user
4. Or publish the app (if ready for production)

### Environment Variables Not Working

**Problem:** Variables not loading in your app.

**Solution:**
- **Local:** Make sure file is named `.env.local` (not `.env`)
- **Local:** Restart your dev server after adding variables
- **Vercel:** Make sure you redeployed after adding variables
- **Vercel:** Check that variables are set for the correct environment (Production/Preview/Development)

### "Invalid client" Error

**Problem:** Client ID or Secret is incorrect.

**Solution:**
1. Double-check you copied the entire Client ID and Secret
2. Make sure there are no extra spaces
3. In `.env.local`, use double quotes around values
4. Restart your server

---

## Security Best Practices

1. **Never commit `.env.local` to git** - It should be in `.gitignore`
2. **Never share your Client Secret** publicly
3. **Use different OAuth clients** for development and production (optional but recommended)
4. **Rotate secrets** if they're ever exposed
5. **Limit redirect URIs** to only your actual domains

---

## Quick Checklist

- [ ] Google Cloud Project created/selected
- [ ] Google Sheets API enabled
- [ ] OAuth consent screen configured
- [ ] OAuth scopes added (`spreadsheets` and `drive.file`)
- [ ] OAuth client ID created
- [ ] Authorized redirect URIs added
- [ ] Client ID and Secret copied
- [ ] Environment variables added to `.env.local` (local)
- [ ] Environment variables added to Vercel (production)
- [ ] Development server restarted (local)
- [ ] Application redeployed (Vercel)
- [ ] OAuth flow tested

---

## Need Help?

If you're stuck:
1. Check the error message in your browser console or server logs
2. Verify each step was completed correctly
3. Make sure your redirect URIs match exactly
4. Ensure environment variables are set correctly
5. Check that Google Sheets API is enabled

Once all steps are complete, your users will be able to connect their Google Sheets with just a few clicks! 🎉





