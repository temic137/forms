# Firebase Authentication Troubleshooting Guide for Vercel

## Problem: "Firebase verification failed" Error (401)

If you're getting a `401` error and "Firebase verification failed" when trying to log in with Google on Vercel, this guide will help you fix it.

## Root Causes

The error occurs when Firebase Admin SDK cannot verify the ID token from the client. Common causes:

1. **Missing Firebase Admin environment variables** in Vercel
2. **Incorrect `FIREBASE_PRIVATE_KEY` formatting** (newline issues)
3. **Firebase project ID mismatch** between client and server
4. **Missing `NEXTAUTH_URL`** or incorrect value

## Solution Steps

### Step 1: Verify Firebase Admin Environment Variables

Go to your Vercel project dashboard → Settings → Environment Variables and ensure these are set:

#### Required Variables:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\nHere\n-----END PRIVATE KEY-----\n"
```

#### Important Notes:

1. **`FIREBASE_PRIVATE_KEY` Formatting**:
   - The private key must include the full key with `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
   - In Vercel, you can paste it as a single line with `\n` characters, OR
   - Paste it as a multi-line string (Vercel supports this)
   - The code automatically converts `\n` to actual newlines

2. **How to Get Firebase Admin Credentials**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Download the JSON file
   - Extract:
     - `project_id` → `FIREBASE_PROJECT_ID`
     - `client_email` → `FIREBASE_CLIENT_EMAIL`
     - `private_key` → `FIREBASE_PRIVATE_KEY`

### Step 2: Verify Client-Side Firebase Config

Ensure your client-side Firebase config matches your Firebase project:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

**Critical**: The `NEXT_PUBLIC_FIREBASE_PROJECT_ID` must match `FIREBASE_PROJECT_ID`!

### Step 3: Verify NextAuth Configuration

Ensure these are set:

```env
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-secret-key-here
```

**Important**: 
- `NEXTAUTH_URL` must be your actual Vercel deployment URL (not `localhost`)
- Generate `NEXTAUTH_SECRET` using: `openssl rand -base64 32`

### Step 4: Check Firebase Console Settings

1. **Authorized Domains**:
   - Go to Firebase Console → Authentication → Settings → Authorized domains
   - Ensure your Vercel domain is added (e.g., `your-app.vercel.app`)

2. **OAuth Consent Screen** (if using Google OAuth):
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Select your project
   - Go to APIs & Services → OAuth consent screen
   - Add your Vercel domain to authorized domains

### Step 5: Redeploy After Changes

After updating environment variables in Vercel:
1. Go to Deployments tab
2. Click the three dots (⋯) on the latest deployment
3. Click "Redeploy"
4. Wait for deployment to complete

## Testing the Fix

1. Clear your browser cache and cookies
2. Try logging in with Google again
3. Check Vercel function logs for detailed error messages:
   - Go to Vercel Dashboard → Your Project → Functions
   - Look for errors in the `/api/auth/[...nextauth]` function

## Common Error Messages and Solutions

### "Missing Firebase Admin credentials"
- **Solution**: Add `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` to Vercel environment variables

### "Firebase Admin initialization failed"
- **Solution**: Check that `FIREBASE_PRIVATE_KEY` is correctly formatted with proper newlines

### "auth/invalid-credential" or "auth/argument-error"
- **Solution**: Verify that the Firebase project IDs match between client and server configs

### "401 Unauthorized"
- **Solution**: Check `NEXTAUTH_URL` and `NEXTAUTH_SECRET` are set correctly

## Debugging Tips

1. **Check Vercel Logs**:
   - Go to Vercel Dashboard → Your Project → Logs
   - Look for error messages during login attempts
   - The improved error handling will show more detailed messages

2. **Verify Environment Variables**:
   - In Vercel, go to Settings → Environment Variables
   - Ensure variables are set for **Production** environment
   - Check that there are no extra spaces or quotes

3. **Test Locally First**:
   - Copy your Vercel environment variables to `.env.local`
   - Test the login flow locally
   - If it works locally but not on Vercel, it's likely an environment variable issue

## Still Having Issues?

If the problem persists:

1. Check the Vercel function logs for the exact error message
2. Verify all environment variables are set correctly
3. Ensure Firebase project IDs match between client and server
4. Make sure your Vercel domain is authorized in Firebase Console

## Quick Checklist

- [ ] `FIREBASE_PROJECT_ID` is set in Vercel
- [ ] `FIREBASE_CLIENT_EMAIL` is set in Vercel
- [ ] `FIREBASE_PRIVATE_KEY` is set correctly (with proper formatting)
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID` matches `FIREBASE_PROJECT_ID`
- [ ] `NEXTAUTH_URL` is set to your Vercel domain
- [ ] `NEXTAUTH_SECRET` is set
- [ ] Vercel domain is authorized in Firebase Console
- [ ] Redeployed after setting environment variables

