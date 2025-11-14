# Vercel Deployment Guide

This guide will help you deploy your Next.js forms application to Vercel.

## Prerequisites

- A Vercel account (sign up at [vercel.com](https://vercel.com))
- Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
- All environment variables ready

## Step 1: Prepare Your Repository

Make sure your code is committed and pushed to your Git repository:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

## Step 2: Deploy via Vercel Dashboard (Recommended)

### 2.1 Import Your Project

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your Git repository
4. Select your repository and click **"Import"**

### 2.2 Configure Project Settings

Vercel will auto-detect Next.js. Configure these settings:

- **Framework Preset:** Next.js (auto-detected)
- **Root Directory:** `./` (leave as default)
- **Build Command:** `npm run build` (or `prisma generate && next build` if needed)
- **Output Directory:** `.next` (auto-detected)
- **Install Command:** `npm install`

### 2.3 Set Environment Variables

In the **Environment Variables** section, add all required variables:

#### Required Environment Variables

```env
# Database (Required)
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
DIRECT_DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"

# NextAuth (Required)
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="https://your-app.vercel.app"

# AI Services (Optional - if using AI features)
GROQ_API_KEY="your-groq-api-key"
GOOGLE_AI_API_KEY="your-google-ai-key"
TOGETHER_API_KEY="your-together-api-key"

# Google OAuth (Optional - if using Google sign-in)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Firebase (Optional - if using Firebase auth)
FIREBASE_PROJECT_ID="your-firebase-project-id"
FIREBASE_CLIENT_EMAIL="your-firebase-client-email"
FIREBASE_PRIVATE_KEY="your-firebase-private-key"
NEXT_PUBLIC_FIREBASE_API_KEY="your-firebase-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-firebase-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="your-measurement-id"

# Stripe (Optional - if using payments)
STRIPE_SECRET_KEY="your-stripe-secret-key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"

# Resend (Optional - if using email)
RESEND_API_KEY="your-resend-api-key"

# Base URL (Optional - for file downloads)
NEXT_PUBLIC_BASE_URL="https://your-app.vercel.app"
```

**Important Notes:**
- Replace all placeholder values with your actual credentials
- For `NEXTAUTH_SECRET`, generate a random string: `openssl rand -base64 32`
- For `NEXTAUTH_URL`, use your Vercel deployment URL (will be provided after first deploy)
- Set environment variables for **Production**, **Preview**, and **Development** environments as needed

### 2.4 Deploy

Click **"Deploy"** and wait for the build to complete.

## Step 3: Post-Deployment Setup

### 3.1 Update NEXTAUTH_URL

After the first deployment:

1. Copy your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
2. Go to **Project Settings** → **Environment Variables**
3. Update `NEXTAUTH_URL` with your actual Vercel URL
4. Redeploy (or it will auto-redeploy on next push)

### 3.2 Run Database Migrations

If you haven't run migrations yet, you can:

**Option A: Run locally and push to production database**
```bash
# Make sure DIRECT_DATABASE_URL points to your production database
npx prisma migrate deploy
```

**Option B: Use Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Link your project
vercel link

# Run migrations in production
vercel env pull .env.production
npx prisma migrate deploy
```

### 3.3 Update OAuth Redirect URLs

If using Google OAuth:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client
4. Add authorized redirect URI: `https://your-app.vercel.app/api/auth/callback/google`

## Step 4: Deploy via Vercel CLI (Alternative)

If you prefer using the command line:

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (follow prompts)
vercel

# For production deployment
vercel --prod
```

## Step 5: Configure Build Settings

If you encounter Prisma generation issues, you may need to update your build command:

1. Go to **Project Settings** → **General** → **Build & Development Settings**
2. Update **Build Command** to:
   ```
   prisma generate && next build
   ```

Or update `package.json` build script (already done if you followed the setup).

## Troubleshooting

### Build Fails with Prisma Errors

**Solution:** Ensure `prisma generate` runs before `next build`. Update build command or `package.json`.

### Database Connection Errors

**Solution:** 
- Verify `DATABASE_URL` uses the connection pooler (port 6543)
- Check that your Supabase project allows connections from Vercel IPs
- Ensure SSL mode is set: `?sslmode=require`

### Environment Variables Not Working

**Solution:**
- Make sure variables are set for the correct environment (Production/Preview/Development)
- Redeploy after adding new environment variables
- Check variable names match exactly (case-sensitive)

### NextAuth Errors

**Solution:**
- Verify `NEXTAUTH_SECRET` is set and is a random string
- Ensure `NEXTAUTH_URL` matches your Vercel deployment URL
- Check OAuth callback URLs are configured correctly

## Continuous Deployment

Vercel automatically deploys when you push to your main branch:
- **Production:** Deploys from `main`/`master` branch
- **Preview:** Deploys from other branches and pull requests

## Custom Domain

To add a custom domain:

1. Go to **Project Settings** → **Domains**
2. Add your domain
3. Follow DNS configuration instructions
4. Update `NEXTAUTH_URL` environment variable with your custom domain

## Monitoring

- View deployment logs in the Vercel dashboard
- Check function logs for API route debugging
- Use Vercel Analytics for performance monitoring

## Need Help?

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)

