# Quick Fix: Can't Reach Database Server

## Issue
Getting error: "Can't reach database server at `db.[PROJECT-REF].supabase.co:5432`"

## Solution 1: Add SSL Mode (Most Common Fix)

Update your `.env` file to include `?sslmode=require` at the end of your DATABASE_URL:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
```

**Important:** Make sure to add `?sslmode=require` (don't forget the `?` if it's not already there, or use `&` if you already have query parameters).

## Solution 2: Check IP Restrictions

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **Database**
4. Scroll to **Network restrictions**
5. For local development:
   - Either **Allow all IPs** temporarily, OR
   - Add your current IP address

To find your IP address, visit: https://whatismyipaddress.com/

## Solution 3: Verify Connection String

1. Go to Supabase dashboard → **Settings** → **Database**
2. Copy the connection string again
3. Make sure the password doesn't have special characters that need URL encoding
4. If your password has special characters (like `@`, `#`, `%`, etc.), they need to be URL-encoded:
   - `@` becomes `%40`
   - `#` becomes `%23`
   - `%` becomes `%25`
   - Space becomes `%20` or `+`

## After Making Changes

1. Save your `.env` file
2. Run the command again:
   ```bash
   npm run db:push
   ```

## Still Having Issues?

1. Test the connection in Supabase SQL Editor (should work)
2. Try using a PostgreSQL client (pgAdmin, DBeaver, etc.)
3. Check if your firewall/antivirus is blocking the connection
4. Try using the connection pooler URL instead (see SUPABASE_SETUP.md)

