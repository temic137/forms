# Security Guidelines

## Environment Variables

This project uses environment variables to store sensitive credentials. **NEVER** commit API keys, secrets, or credentials directly in code.

### Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your actual credentials in `.env`

3. The `.env` file is already in `.gitignore` and will not be committed

### Protected Files

The following files are automatically ignored by git:
- `.env`
- `.env.local`
- `.env.development.local`
- `.env.test.local`
- `.env.production.local`
- `*-firebase-adminsdk-*.json`

### API Key Security

#### Firebase API Keys (Client-side)
Firebase API keys with `NEXT_PUBLIC_` prefix are safe to expose in the browser. However:
- Always use Firebase Security Rules to protect your data
- Enable App Check to prevent unauthorized access
- Add API key restrictions in Google Cloud Console

#### Server-side Keys
The following keys must NEVER be exposed:
- `FIREBASE_PRIVATE_KEY`
- `GROQ_API_KEY`
- `RESEND_API_KEY`
- `COHERE_API_KEY`
- `GOOGLE_AI_API_KEY`
- `PUSHER_SECRET`
- `GOOGLE_CLIENT_SECRET`
- `CLOUDINARY_API_SECRET`
- `DATABASE_URL`
- `NEXTAUTH_SECRET`

### Best Practices

1. **Never hardcode credentials** - Always use environment variables
2. **Don't commit `.env` files** - They're in `.gitignore` for a reason
3. **Rotate compromised keys immediately** - If a key is exposed, regenerate it
4. **Use different keys for development and production**
5. **Add API restrictions** - Limit keys to specific domains/IPs when possible
6. **Review commits before pushing** - Check for accidentally added secrets

### If You Accidentally Commit Secrets

1. **Immediately rotate the exposed credentials**
2. **Remove from git history** using `git filter-branch` or BFG Repo-Cleaner
3. **Force push** to update remote repository (if already pushed)
4. **Monitor for unauthorized usage**

### Deployment

When deploying to platforms like Vercel, Netlify, or Railway:
1. Add all environment variables in the platform's dashboard
2. Never commit production credentials to the repository
3. Use platform-specific secret management features

### Resources

- [Google Cloud API Key Best Practices](https://cloud.google.com/docs/authentication/api-keys)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
