# Transaction Pooler Setup Guide

## Current Setup

You're using a **transaction pooler** for runtime queries, which is great for serverless environments. However, Prisma migrations and schema operations require a **direct connection** because they use prepared statements that transaction poolers don't support.

## Solution: Use Both Connection URLs

1. **Transaction Pooler** (`DATABASE_URL`) - For runtime application queries ✅ (Already set)
2. **Direct Connection** (`DIRECT_DATABASE_URL`) - For migrations and schema operations

## Step 1: Get Your Direct Connection URL

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Settings** → **Database**
4. Scroll to **Connection string** section
5. Copy the **URI** connection string (NOT the pooler URL)

It should look like:
```
postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

## Step 2: Add Direct Connection to .env

Add this to your `.env` file:

```env
# Transaction pooler - for runtime queries (serverless-friendly)
DATABASE_URL="postgresql://postgres.dewurncddfkjrfulphww:temi2474@aws-1-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"

# Direct connection - for migrations and schema operations
DIRECT_DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
```

Replace `[YOUR-PASSWORD]` and `[YOUR-PROJECT-REF]` with your actual values.

## Step 3: Push Your Schema

Now you can run:

```bash
npm run db:push
```

This will use `DIRECT_DATABASE_URL` for the migration, while your app will continue using the transaction pooler (`DATABASE_URL`) for all runtime queries.

## How It Works

- **Migrations/Schema Operations** (`db push`, `migrate`, etc.):
  - Uses `DIRECT_DATABASE_URL` (direct connection)
  - Supports prepared statements needed for schema changes

- **Runtime Application Queries**:
  - Uses `DATABASE_URL` (transaction pooler)
  - Better for serverless environments
  - Handles connection pooling automatically

## Important Notes

- The direct connection URL is only needed for migrations
- Your application will always use the transaction pooler for queries
- Keep both URLs in your `.env` file
- In production, set both environment variables in your hosting platform

## Troubleshooting

If you get "prepared statement already exists" errors:
- Make sure you're using `DIRECT_DATABASE_URL` for migrations
- Check that your `.env` file has both URLs set correctly

