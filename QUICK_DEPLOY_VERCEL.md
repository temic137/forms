# Quick Vercel Deployment Guide

## 🚀 Fast Track (5 minutes)

### 1. Push to Git
```bash
git add .
git commit -m "Ready for Vercel"
git push
```

### 2. Deploy on Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Click **Deploy** (Vercel auto-detects Next.js)

### 3. Add Environment Variables
In Vercel Dashboard → Project Settings → Environment Variables, add:

**Required:**
- `DATABASE_URL` - Your Supabase connection pooler URL
- `DIRECT_DATABASE_URL` - Your Supabase direct connection URL  
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `NEXTAUTH_URL` - Your Vercel URL (update after first deploy)

**Optional (add as needed):**
- `GROQ_API_KEY` - For AI features
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` - For Google OAuth
- `STRIPE_SECRET_KEY` - For payments
- `RESEND_API_KEY` - For emails
- Firebase variables - If using Firebase auth

### 4. Redeploy
After adding environment variables, trigger a new deployment.

### 5. Update OAuth Callbacks
If using Google OAuth, add to Google Cloud Console:
- `https://your-app.vercel.app/api/auth/callback/google`

## ✅ That's It!

Your app is now live! Check the full guide in `VERCEL_DEPLOYMENT.md` for detailed instructions.

