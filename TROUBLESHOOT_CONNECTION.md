# Troubleshooting: Can't Reach Database (No IP Restrictions)

Since you've confirmed there are no IP restrictions, let's check other common causes:

## 1. Check if Project is Paused ⚠️ (Most Common)

Supabase free tier projects **automatically pause after 7 days of inactivity**.

**To check:**
1. Go to https://supabase.com/dashboard
2. Look at your project - if it shows "Paused" or "Restore", click to restore it
3. Wait 1-2 minutes for the project to fully start
4. Try connecting again

## 2. Verify Connection String from Dashboard

**Important:** Get the connection string directly from Supabase dashboard to ensure it's correct:

1. Go to Supabase dashboard → Your project
2. **Settings** → **Database**
3. Scroll to **Connection string** section
4. Click on **URI** tab (not JDBC or other formats)
5. Copy the **exact** connection string shown
6. Replace `[YOUR-PASSWORD]` with your actual password
7. Update your `.env` file with this exact string

## 3. Check for Temporary IP Ban

If you've had multiple failed connection attempts, your IP might be temporarily blocked.

**Solution:**
- Wait 30 minutes and try again
- Or contact Supabase support to unblock your IP

## 4. Test Connection in Supabase SQL Editor

1. Go to Supabase dashboard → Your project
2. Click **SQL Editor** in the left sidebar
3. Try running a simple query: `SELECT 1;`
4. If this works, the database is accessible and the issue is with the connection string format

## 5. Verify Password Encoding

If your password contains special characters, they need to be URL-encoded:
- `@` → `%40`
- `#` → `%23`
- `%` → `%25`
- `&` → `%26`
- Space → `%20` or `+`

## 6. Try Different SSL Modes

Try these variations in your connection string:

```env
# Option 1: sslmode=require (current)
DIRECT_DATABASE_URL="postgresql://postgres:temi2474@db.dewurncddfkjrfulphww.supabase.co:5432/postgres?sslmode=require"

# Option 2: sslmode=prefer
DIRECT_DATABASE_URL="postgresql://postgres:temi2474@db.dewurncddfkjrfulphww.supabase.co:5432/postgres?sslmode=prefer"

# Option 3: No sslmode parameter (let it auto-detect)
DIRECT_DATABASE_URL="postgresql://postgres:temi2474@db.dewurncddfkjrfulphww.supabase.co:5432/postgres"
```

## 7. Check Firewall/Antivirus

Your local firewall or antivirus might be blocking the connection:
- Temporarily disable firewall/antivirus and test
- Add PostgreSQL/Supabase to firewall exceptions

## 8. Test with psql (if available)

If you have PostgreSQL client installed:

```bash
psql "postgresql://postgres:temi2474@db.dewurncddfkjrfulphww.supabase.co:5432/postgres?sslmode=require"
```

## 9. Verify Project Status

Check in Supabase dashboard:
- Is the project showing as "Active"?
- Are there any warnings or errors in the project status?
- Check the project logs for any connection errors

## Quick Test Script

Create a test file to verify the connection:

```javascript
// test-connection.js
const { PrismaClient } = require('./generated/prisma-client/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_DATABASE_URL,
    },
  },
});

async function test() {
  try {
    await prisma.$connect();
    console.log('✅ Connection successful!');
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

test();
```

Run: `node test-connection.js`

