# Environment Files Explanation

## Using Just `.env` File

This project uses a single `.env` file for simplicity. Both Prisma CLI and Next.js will read from this file.

## Why Two Files? (Optional)

In some Next.js projects, you might have both `.env` and `.env.local`:

### `.env` File
- **Used by:** Prisma CLI, build tools, and scripts
- **Loaded by:** `prisma.config.ts` explicitly loads this file
- **Purpose:** Database connection for migrations and schema operations
- **Contains:** `DATABASE_URL` and `DIRECT_DATABASE_URL`

### `.env.local` File
- **Used by:** Next.js application at runtime
- **Loaded by:** Next.js automatically (takes precedence over `.env`)
- **Purpose:** Environment variables for your running application
- **Contains:** All environment variables including `DATABASE_URL`

## Current Setup

This project uses a single `.env` file:

**`.env`** (used by both Prisma and Next.js):
```env
DATABASE_URL="postgresql://postgres.dewurncddfkjrfulphww:temi2474@aws-1-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
DIRECT_DATABASE_URL="postgresql://postgres.dewurncddfkjrfulphww:temi2474@aws-1-us-west-1.pooler.supabase.com:5432/postgres?pgbouncer=true&sslmode=require"
```

**`.env.local`** (if it exists, it should NOT have DATABASE_URL entries to avoid conflicts)

## How It Works

1. **Prisma CLI** (`db push`, `migrate`, etc.) reads from `.env` (via `prisma.config.ts`)
2. **Next.js app** automatically reads from `.env` (if `.env.local` doesn't override it)
3. **Single source of truth** - easier to maintain!

## Best Practice

- Keep both files synchronized
- `.env.local` is typically gitignored (more secure for local secrets)
- `.env` can be committed with placeholder values for team members
- Update both when changing database configuration

## What Happens Now?

✅ **Prisma migrations** → Uses `.env` (via `prisma.config.ts`)
✅ **Next.js app runtime** → Uses `.env` (automatic, since `.env.local` doesn't override it)
✅ **Single file to maintain** → Simpler and cleaner! 🎉

## Note

- All database configuration is in `.env`
- `.env.local` can still exist for other local-only variables (but won't override DATABASE_URL)
- Next.js automatically loads `.env` if `.env.local` doesn't have conflicting variables

