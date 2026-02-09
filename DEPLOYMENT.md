# Deployment Guide

This guide will help you deploy your application securely without exposing sensitive credentials.

## Pre-Deployment Checklist

Before deploying or making your repository public:

- [ ] All API keys are in `.env` file (not in code)
- [ ] `.env` file is in `.gitignore`
- [ ] `.env.example` is committed (with placeholder values)
- [ ] No hardcoded credentials in any files
- [ ] Pre-commit hook is installed (`.git/hooks/pre-commit`)
- [ ] Run `npm run check-env` to verify all variables are set
- [ ] Review `SECURITY.md` for best practices

## Environment Variables Setup

### 1. Local Development

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your actual credentials
# Never commit this file!
```

### 2. Vercel Deployment

1. Go to your project settings on Vercel
2. Navigate to "Environment Variables"
3. Add each variable from your `.env` file:

**Firebase Client (Public - Safe to expose):**
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (optional)

**Firebase Admin (Secret - Server only):**
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (keep the `\n` characters)

**Database:**
- `DATABASE_URL`
- `DIRECT_DATABASE_URL`

**Authentication:**
- `NEXTAUTH_SECRET`

**API Keys (Secret):**
- `GROQ_API_KEY`
- `RESEND_API_KEY`
- `COHERE_API_KEY`
- `GOOGLE_AI_API_KEY`

**Pusher:**
- `PUSHER_APP_ID`
- `NEXT_PUBLIC_PUSHER_KEY`
- `PUSHER_SECRET`
- `NEXT_PUBLIC_PUSHER_CLUSTER`

**Google OAuth:**
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

**Cloudinary:**
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

**Feature Flags:**
- `NEXT_PUBLIC_VOICE_INPUT_ENABLED` (optional)

### 3. Other Platforms

#### Netlify
1. Go to Site Settings → Environment Variables
2. Add all variables from your `.env` file

#### Railway
1. Go to your project → Variables
2. Add all variables from your `.env` file

#### Docker
Create a `.env` file in your deployment environment and use `--env-file` flag:
```bash
docker run --env-file .env your-image
```

## Security Best Practices

### API Key Restrictions

1. **Firebase API Key:**
   - Go to Google Cloud Console → Credentials
   - Edit your API key
   - Add application restrictions (HTTP referrers)
   - Add API restrictions (only enable Firebase APIs)

2. **Google AI API Key:**
   - Go to Google AI Studio
   - Add domain restrictions
   - Set usage quotas

3. **Cloudinary:**
   - Enable signed uploads
   - Add allowed domains

### Firebase Security Rules

Ensure your Firebase Security Rules are properly configured:

```javascript
// Firestore Rules Example
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Database Security

- Use connection pooling (PgBouncer) for production
- Enable SSL/TLS for database connections
- Use read-only replicas for analytics queries
- Regularly rotate database credentials

## Testing Before Deployment

```bash
# Check environment variables
npm run check-env

# Test build locally
npm run build

# Test production build
npm run start
```

## Monitoring

After deployment, monitor:
- API usage in Google Cloud Console
- Database connections
- Error logs in Vercel/Netlify
- Firebase Authentication logs
- Cloudinary usage

## Troubleshooting

### "Missing environment variables" error
- Verify all variables are set in your deployment platform
- Check for typos in variable names
- Ensure `FIREBASE_PRIVATE_KEY` includes `\n` characters

### Firebase authentication not working
- Verify `FIREBASE_PROJECT_ID` matches `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- Check Firebase Security Rules
- Ensure domain is added to Firebase authorized domains

### Database connection errors
- Verify `DATABASE_URL` is correct
- Check if database accepts connections from deployment platform
- Ensure SSL mode is set correctly

## Making Repository Public

Before making your repository public:

1. **Clean git history:**
   ```bash
   # Already done - test.py removed from history
   git log --all --full-history -- test.py
   # Should return nothing
   ```

2. **Verify no secrets in code:**
   ```bash
   # Search for API keys
   git grep -i "AIzaSy"
   git grep -i "sk-"
   git grep -i "BEGIN PRIVATE KEY"
   # Should return nothing
   ```

3. **Final security check:**
   ```bash
   npm run check-env
   git status
   ```

4. **Push cleaned history:**
   ```bash
   # Force push to update remote (CAUTION: This rewrites history)
   git push origin --force --all
   git push origin --force --tags
   ```

5. **Make repository public:**
   - Go to GitHub → Settings → Change visibility

## Post-Deployment

- [ ] Test all features in production
- [ ] Verify authentication works
- [ ] Check database connectivity
- [ ] Monitor API usage for unusual activity
- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Configure domain and SSL certificate
- [ ] Add status page monitoring

## Support

If you encounter issues:
1. Check the logs in your deployment platform
2. Review `SECURITY.md` for security guidelines
3. Verify environment variables are correctly set
4. Check Firebase console for authentication errors
