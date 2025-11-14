# Supabase Database Setup Guide

This guide will help you connect your application to a remote Supabase database.

## Prerequisites

- A Supabase account and project
- Your Supabase database password

## Step 1: Get Your Supabase Connection String

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Settings** → **Database**
4. Scroll down to **Connection string** section
5. Copy the **URI** connection string (not the JDBC or other formats)

The connection string will look like:
```
postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

### For Connection Pooling (Recommended for Serverless/Next.js)

If you're deploying to serverless environments (Vercel, Netlify, etc.), use the connection pooler:

1. In the same **Settings** → **Database** page
2. Look for **Connection pooling** section
3. Use the **Session mode** connection string

Example format:
```
postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

## Step 2: Create Environment File

Create a `.env` file in the root of your project (if it doesn't exist) and add:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
```

Replace:
- `[YOUR-PASSWORD]` with your actual Supabase database password
- `[YOUR-PROJECT-REF]` with your project reference ID

**Important Notes:**
- The `?sslmode=require` parameter is **required** for Supabase connections
- Never commit your `.env` file to version control. It's already in `.gitignore`.
- If you're using connection pooling, use the pooler URL instead (see below)

## Step 3: Generate Prisma Client

After setting up your `.env` file, generate the Prisma client:

```bash
npx prisma generate
```

## Step 4: Run Database Migrations

Push your schema to the Supabase database:

```bash
npx prisma db push
```

Or, if you want to use migrations:

```bash
npx prisma migrate dev --name init
```

## Step 5: Verify Connection

You can verify the connection by opening Prisma Studio:

```bash
npx prisma studio
```

This will open a browser interface where you can view and edit your database.

## Troubleshooting

### "Can't reach database server" Error

If you get a "Can't reach database server" error:

1. **Add SSL mode to connection string** (most common fix):
   ```
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
   ```
   The `?sslmode=require` parameter is required for Supabase.

2. **Check IP restrictions**:
   - Go to Supabase dashboard → Settings → Database
   - Check "Network restrictions" section
   - For local development, you may need to:
     - Allow all IPs temporarily, OR
     - Add your current IP address to the allowed list
   - If you're behind a VPN or corporate firewall, you may need to whitelist those IPs

3. **Verify your connection string**:
   - Double-check the password (it's URL-encoded if it contains special characters)
   - Verify the project reference ID is correct
   - Make sure you're using the correct port (5432 for direct connection)

4. **Test connection**:
   - You can test the connection in Supabase dashboard → SQL Editor
   - Try connecting with a PostgreSQL client (like pgAdmin or DBeaver)

### Connection Timeout

If you're experiencing connection timeouts:
1. Check your Supabase project is active and not paused
2. Verify your internet connection
3. Check if your firewall or antivirus is blocking the connection
4. Try using the connection pooler URL instead (see connection pooling section above)

### Migration Issues

If you have existing migrations from SQLite, you may need to:
1. Create a new migration for PostgreSQL
2. Review and update any SQLite-specific syntax
3. Run `npx prisma migrate reset` (⚠️ This will delete all data) or manually migrate your data

## Next Steps

- Set up environment variables for production (Vercel, Netlify, etc.)
- Configure connection pooling for production
- Set up database backups in Supabase dashboard
- Review Supabase security settings

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Prisma PostgreSQL Guide](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

