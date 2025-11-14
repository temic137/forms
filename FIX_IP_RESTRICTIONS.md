# Fix: Can't Reach Database Server

## Issue
Both the pooler and direct connection are showing "Can't reach database server" errors. This is almost always due to **IP restrictions** in Supabase.

## Solution: Allow Your IP Address

### Step 1: Check Your Current IP
Visit: https://whatismyipaddress.com/
Copy your IP address.

### Step 2: Update Supabase IP Restrictions

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Settings** → **Database**
4. Scroll down to **Network restrictions** section
5. You'll see options:
   - **Restrict connections to specific IP addresses** (if enabled, this is blocking you)
   - **Allow connections from any IP address** (recommended for development)

### Step 3: Choose One Option

**Option A: Allow All IPs (Easiest for Development)**
- Toggle **"Allow connections from any IP address"** to ON
- This allows connections from anywhere (good for local development)
- ⚠️ For production, you should restrict this

**Option B: Add Your Specific IP**
- If you want to keep restrictions enabled:
  - Click **"Add IP address"**
  - Enter your current IP address
  - Click **"Save"**
- Note: If your IP changes (common with home internet), you'll need to update this

### Step 4: Test Connection

After updating IP restrictions, wait a few seconds, then try again:

```bash
npm run db:push
```

## Why This Happens

Supabase, by default, may restrict database connections to specific IP addresses for security. When you try to connect from a new location (your computer), it blocks the connection unless your IP is whitelisted.

## For Production

In production (Vercel, Netlify, etc.):
- Your hosting platform's IP addresses are usually already whitelisted
- Or you can add your hosting platform's IP ranges
- Or use Supabase's connection pooler which often has different IP restrictions

## Still Having Issues?

1. **Check if your project is paused**: Supabase free tier projects pause after inactivity
2. **Verify your password**: Make sure the password in the connection string is correct
3. **Check firewall**: Your local firewall/antivirus might be blocking the connection
4. **Try from Supabase SQL Editor**: If the SQL Editor works, it's definitely an IP restriction issue

