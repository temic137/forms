# 🚀 Pre-Deployment Checklist - AnyForm

Use this checklist before making your repository public and deploying to production.

---

## ✅ Before Making Repository Public (GitHub)

### Security Checks
- [x] `.env` files are gitignored (`.env*` in `.gitignore`)
- [x] No API keys or secrets in code
- [x] No secrets in git history
- [x] `.env.example` contains only placeholders
- [x] Database files are gitignored (`*.db`, `prisma/dev.db`)
- [x] Firebase admin SDK keys are gitignored (`*-firebase-adminsdk-*.json`)
- [x] No personal information in code or comments
- [x] Security audit completed (see `SECURITY_AUDIT_REPORT.md`)

### Code Quality
- [x] Remove unnecessary files and folders
- [x] Clean up console.log statements (or ensure no sensitive data logged)
- [x] Remove TODO comments with sensitive information
- [x] Update README with proper setup instructions
- [x] Add LICENSE file (if needed for hackathon)
- [ ] Run `npm run lint` and fix issues
- [ ] Test the application works after cleanup

### Documentation
- [x] README.md is up to date
- [x] `.env.example` is complete with all required variables
- [ ] Add CONTRIBUTING.md (optional)
- [ ] Add setup instructions for local development
- [ ] Document all environment variables

---

## 🔐 Environment Variables Setup

### Required Variables (Must Set)

```bash
# Database
DATABASE_URL="your_database_url_here"

# Authentication
NEXTAUTH_SECRET="generate_with_openssl_rand_base64_32"
NEXTAUTH_URL="http://localhost:3000" # or your production URL

# AI Provider (at least one required)
GROQ_API_KEY="your_groq_api_key"
# OR
GOOGLE_AI_API_KEY="your_google_ai_key"
```

### Optional Variables (Feature-Dependent)

```bash
# Email Notifications
RESEND_API_KEY="your_resend_api_key"
RESEND_FROM_EMAIL="your@email.com"

# Google OAuth
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# Firebase Authentication
FIREBASE_PROJECT_ID="your_project_id"
FIREBASE_CLIENT_EMAIL="your_client_email"
FIREBASE_PRIVATE_KEY="your_private_key"
NEXT_PUBLIC_FIREBASE_API_KEY="your_api_key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_auth_domain"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_project_id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_storage_bucket"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
NEXT_PUBLIC_FIREBASE_APP_ID="your_app_id"

# Image Uploads (Cloudinary)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Cron Job Protection
CRON_SECRET="generate_random_string"

# App Configuration
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NEXT_PUBLIC_VOICE_INPUT_ENABLED="true"
```

---

## 🌐 Deployment to Vercel

### Step 1: Prepare for Deployment

1. **Generate NEXTAUTH_SECRET:**
   ```bash
   openssl rand -base64 32
   ```
   Copy the output and save it for Vercel environment variables.

2. **Verify Build Works Locally:**
   ```bash
   npm run build
   ```
   Fix any build errors before deploying.

3. **Run Database Migrations:**
   ```bash
   npx prisma migrate deploy
   ```

### Step 2: Deploy to Vercel

1. **Install Vercel CLI (optional):**
   ```bash
   npm i -g vercel
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Or use CLI: `vercel`

3. **Set Environment Variables in Vercel:**
   - Go to Project Settings → Environment Variables
   - Add all required variables from the list above
   - Set for Production, Preview, and Development environments

4. **Configure Build Settings:**
   - Framework Preset: Next.js
   - Build Command: `prisma generate && next build`
   - Output Directory: `.next`
   - Install Command: `npm install`

5. **Deploy:**
   - Click "Deploy" or run `vercel --prod`

### Step 3: Post-Deployment

1. **Verify Deployment:**
   - Test all features work in production
   - Check authentication flows
   - Test form creation and submission
   - Verify email notifications (if configured)

2. **Set Up Custom Domain (Optional):**
   - Go to Project Settings → Domains
   - Add your custom domain
   - Update `NEXT_PUBLIC_APP_URL` environment variable

3. **Monitor Application:**
   - Check Vercel logs for errors
   - Set up error monitoring (Sentry, etc.)

---

## 🗄️ Database Setup

### Option 1: Vercel Postgres (Recommended)

1. Go to Vercel Dashboard → Storage → Create Database
2. Select Postgres
3. Copy connection strings
4. Add to environment variables:
   - `DATABASE_URL` (for Prisma - use pooled connection)
   - `DIRECT_DATABASE_URL` (for migrations - use direct connection)

### Option 2: Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Go to Settings → Database
3. Copy connection string (Transaction Pooler)
4. Add to `DATABASE_URL` environment variable

### Option 3: Railway

1. Create project at [railway.app](https://railway.app)
2. Add PostgreSQL service
3. Copy connection string
4. Add to `DATABASE_URL` environment variable

### Run Migrations

After setting up database:

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# (Optional) Seed database
npm run db:seed
```

---

## 🔍 Testing Checklist

### Local Testing
- [ ] Application starts without errors (`npm run dev`)
- [ ] Can create a new form
- [ ] Can submit a form
- [ ] Authentication works (login/signup)
- [ ] Google OAuth works (if configured)
- [ ] Voice input works (if enabled)
- [ ] File uploads work (if configured)
- [ ] Email notifications work (if configured)

### Production Testing
- [ ] Application loads on production URL
- [ ] HTTPS is working
- [ ] All features work in production
- [ ] Database connections work
- [ ] Environment variables are set correctly
- [ ] No console errors in browser
- [ ] Forms can be embedded in other sites
- [ ] Mobile responsive design works

---

## 🛡️ Security Hardening (Production)

### Immediate Actions
- [ ] Set strong `NEXTAUTH_SECRET` (32+ characters)
- [ ] Use production database (not SQLite)
- [ ] Enable HTTPS only
- [ ] Set secure cookie settings
- [ ] Configure CORS properly

### Recommended Enhancements
- [ ] Add rate limiting (Upstash Redis)
- [ ] Implement HTML sanitization (DOMPurify)
- [ ] Set up error monitoring (Sentry)
- [ ] Enable Vercel security features
- [ ] Add request size limits
- [ ] Implement CSRF protection
- [ ] Add security headers
- [ ] Set up logging and monitoring

### Install Security Packages (Optional)

```bash
# HTML Sanitization
npm install dompurify
npm install --save-dev @types/dompurify

# Rate Limiting
npm install @upstash/ratelimit @upstash/redis

# Error Monitoring
npm install @sentry/nextjs
```

---

## 📝 Git Commands

### Before Pushing to GitHub

```bash
# Check what will be committed
git status

# Review changes
git diff

# Add files (be careful not to add .env files)
git add .

# Commit changes
git commit -m "Prepare for public release"

# Push to GitHub
git push origin main
```

### Make Repository Public

1. Go to GitHub repository settings
2. Scroll to "Danger Zone"
3. Click "Change visibility"
4. Select "Public"
5. Confirm by typing repository name

---

## 🎓 Hackathon Submission

### What to Include
- ✅ Clean, well-documented code
- ✅ Comprehensive README.md
- ✅ .env.example with all variables
- ✅ Setup instructions
- ✅ Demo video or screenshots
- ✅ Architecture documentation
- ✅ License file (if required)

### What NOT to Include
- ❌ .env files with real credentials
- ❌ API keys or secrets
- ❌ Database files (dev.db)
- ❌ node_modules folder
- ❌ Build artifacts (.next, dist)
- ❌ Personal information

### Demo Preparation
- [ ] Prepare demo script
- [ ] Test all features work
- [ ] Prepare fallback if live demo fails
- [ ] Have screenshots/video ready
- [ ] Prepare answers for common questions

---

## 🆘 Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check database is accessible from Vercel
- Ensure migrations are run
- Check Prisma schema is valid

### Environment Variables Not Working
- Verify variables are set in Vercel
- Check variable names match exactly
- Restart deployment after adding variables
- Check for typos in variable names

### Authentication Issues
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Ensure OAuth credentials are correct
- Check callback URLs are configured

---

## ✅ Final Checklist

### Before Going Public
- [x] Security audit passed
- [x] All sensitive data removed
- [x] .gitignore is comprehensive
- [x] README is complete
- [ ] Application tested locally
- [ ] Build succeeds without errors
- [ ] All features work as expected

### Before Deploying
- [ ] Environment variables prepared
- [ ] Database set up
- [ ] Migrations ready
- [ ] Domain configured (if using custom domain)
- [ ] Monitoring set up

### After Deployment
- [ ] Test production application
- [ ] Verify all features work
- [ ] Check for errors in logs
- [ ] Test on mobile devices
- [ ] Share with hackathon judges

---

## 🎉 You're Ready!

Once all checkboxes are complete, you're ready to:
1. ✅ Push to public GitHub
2. ✅ Submit to hackathon
3. ✅ Deploy to production
4. ✅ Share with the world!

**Good luck with your hackathon! 🚀**

---

## 📞 Need Help?

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **Security:** See `SECURITY_AUDIT_REPORT.md`
