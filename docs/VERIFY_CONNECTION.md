# Step-by-Step Connection Verification

Since you've confirmed there are **no IP restrictions**, follow these steps in order:

## ✅ Step 1: Check Project Status

1. Go to https://supabase.com/dashboard
2. Look at your project card
3. **Is there a "Restore" or "Paused" button?**
   - ✅ If YES → Click "Restore" and wait 2-3 minutes
   - ✅ If NO → Continue to Step 2

## ✅ Step 2: Get Exact Connection String

1. In Supabase dashboard, go to your project
2. Click **Settings** (gear icon) in left sidebar
3. Click **Database** in settings menu
4. Scroll down to **Connection string** section
5. Make sure **URI** tab is selected (not JDBC, not Node.js, just URI)
6. You should see something like:
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
   OR for direct connection:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

7. **Copy the EXACT string shown** (it will have `[YOUR-PASSWORD]` placeholder)
8. Replace `[YOUR-PASSWORD]` with your actual database password
9. **Important:** If your password has special characters, they might need URL encoding

## ✅ Step 3: Test in Supabase SQL Editor

1. In Supabase dashboard, click **SQL Editor** in left sidebar
2. Click **New query**
3. Type: `SELECT 1;`
4. Click **Run** (or press Ctrl+Enter)
5. **Does it work?**
   - ✅ If YES → Database is accessible, issue is with connection string format
   - ❌ If NO → Project might be paused or there's a database issue

## ✅ Step 4: Update .env File

Update your `.env` file with the EXACT connection string from Step 2:

```env
# For migrations (direct connection)
DIRECT_DATABASE_URL="postgresql://postgres:[YOUR-ACTUAL-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"

# For runtime (transaction pooler - already set)
DATABASE_URL="postgresql://postgres.dewurncddfkjrfulphww:temi2474@aws-1-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
```

**Replace:**
- `[YOUR-ACTUAL-PASSWORD]` with your real password
- `[PROJECT-REF]` with your project reference (looks like: `dewurncddfkjrfulphww`)

## ✅ Step 5: Try Different SSL Modes

If Step 4 doesn't work, try these variations one by one:

**Option A:**
```env
DIRECT_DATABASE_URL="postgresql://postgres:temi2474@db.dewurncddfkjrfulphww.supabase.co:5432/postgres?sslmode=require"
```

**Option B:**
```env
DIRECT_DATABASE_URL="postgresql://postgres:temi2474@db.dewurncddfkjrfulphww.supabase.co:5432/postgres?sslmode=prefer"
```

**Option C:**
```env
DIRECT_DATABASE_URL="postgresql://postgres:temi2474@db.dewurncddfkjrfulphww.supabase.co:5432/postgres"
```

After each change, test with: `npm run db:push`

## ✅ Step 6: Check Password Encoding

If your password contains special characters, they need URL encoding:
- `@` → `%40`
- `#` → `%23`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- Space → `%20`

Example: If password is `pass@word`, use `pass%40word` in connection string.

## ✅ Step 7: Verify Connection String Components

Your connection string should have:
- ✅ Protocol: `postgresql://`
- ✅ Username: `postgres`
- ✅ Password: Your actual password (URL-encoded if needed)
- ✅ Host: `db.[PROJECT-REF].supabase.co`
- ✅ Port: `5432`
- ✅ Database: `postgres`
- ✅ SSL: `?sslmode=require` (recommended)

## Still Not Working?

1. **Check Supabase Status Page**: https://status.supabase.com/
2. **Try from different network** (mobile hotspot) to rule out ISP blocking
3. **Contact Supabase Support** with:
   - Your project reference ID
   - The exact error message
   - Confirmation that IP restrictions are disabled
   - Confirmation that project is not paused

