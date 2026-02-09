# Quick Start Guide

## 🚀 Getting Started

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd forms
npm install
```

### 2. Set Up Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your actual credentials
# Use your favorite editor (VS Code, Notepad, etc.)
code .env
```

### 3. Verify Configuration

```bash
# Check all environment variables are set
npm run check-env

# Test Firebase configuration
node scripts/test-firebase.js
```

### 4. Set Up Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Seed database
npm run db:seed
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📋 Quick Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Environment
npm run check-env        # Verify environment variables
node scripts/test-firebase.js  # Test Firebase config

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:migrate       # Create migration
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Seed database

# Code Quality
npm run lint             # Run ESLint
```

## 🔐 Security Checklist

Before committing:
- [ ] No API keys in code
- [ ] `.env` file not staged
- [ ] Run `npm run check-env`
- [ ] Pre-commit hook is active

Before deploying:
- [ ] All environment variables set in platform
- [ ] Firebase Security Rules configured
- [ ] API key restrictions enabled
- [ ] Test build succeeds

Before making public:
- [ ] Review `SECURITY.md`
- [ ] Review `DEPLOYMENT.md`
- [ ] No secrets in git history
- [ ] Pre-commit hook tested

## 📚 Documentation

- **SECURITY.md** - Security guidelines and best practices
- **DEPLOYMENT.md** - Comprehensive deployment guide
- **SECURITY-FIX-SUMMARY.md** - Recent security fixes
- **.env.example** - Environment variables template

## 🆘 Troubleshooting

### Environment Variables Missing
```bash
npm run check-env
# Follow the output to see what's missing
```

### Firebase Not Working
```bash
node scripts/test-firebase.js
# Check if configuration is valid
```

### Build Fails
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Database Issues
```bash
# Reset database
npm run db:push -- --force-reset
npm run db:seed
```

## 🌐 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

See `DEPLOYMENT.md` for detailed instructions for:
- Netlify
- Railway
- Docker
- Custom servers

## 🔗 Useful Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Vercel Documentation](https://vercel.com/docs)

## 💡 Tips

1. **Keep `.env` file secure** - Never commit it to git
2. **Use different keys for dev/prod** - Separate environments
3. **Monitor API usage** - Check Google Cloud Console regularly
4. **Enable 2FA** - On all service accounts
5. **Regular backups** - Backup your database regularly

## 🎯 Next Steps

1. Customize the app for your needs
2. Set up Firebase Security Rules
3. Configure authentication providers
4. Add your custom domain
5. Set up monitoring and analytics

---

**Need Help?** Check the documentation files or open an issue on GitHub.
