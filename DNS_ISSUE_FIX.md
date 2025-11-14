# DNS Resolution Issue Fix

## Problem
Getting `ENOTFOUND` error when trying to connect. This means your computer can't resolve the hostname `db.dewurncddfkjrfulphww.supabase.co`.

## Why SQL Editor Works But Local Connection Doesn't

The Supabase SQL Editor works because:
- It connects through Supabase's web infrastructure
- It doesn't use your local DNS
- It might use a different hostname internally

## Solutions

### Solution 1: Verify Exact Hostname from Supabase

1. Go to Supabase dashboard → Settings → Database
2. Look at the **Connection string** section
3. **Copy the EXACT hostname** shown in the URI
4. It might be slightly different than what we're using

Common variations:
- `db.[PROJECT-REF].supabase.co` (what we're using)
- `[PROJECT-REF].supabase.co` (without `db.` prefix)
- Different subdomain

### Solution 2: Try IP Address Directly

If DNS is the issue, you can try:
1. Get the IP address of your Supabase database
2. Use IP instead of hostname in connection string

**Note:** This is not recommended for production as IPs can change.

### Solution 3: Use Connection Pooler (Recommended)

The connection pooler might use a different hostname that resolves better:

1. Go to Supabase → Settings → Database → Connection pooling
2. Use the **Session Mode** connection string
3. It will have a different hostname (like `aws-0-[region].pooler.supabase.com`)

### Solution 4: Fix DNS

1. **Flush DNS cache:**
   ```powershell
   ipconfig /flushdns
   ```

2. **Try different DNS servers:**
   - Google DNS: `8.8.8.8` and `8.8.4.4`
   - Cloudflare DNS: `1.1.1.1` and `1.0.0.1`

3. **Check hosts file:**
   - Location: `C:\Windows\System32\drivers\etc\hosts`
   - Make sure there's no entry blocking Supabase

### Solution 5: Verify Project Reference

Double-check your project reference ID:
1. Go to Supabase dashboard
2. Look at your project URL or settings
3. Verify the project reference matches: `dewurncddfkjrfulphww`

## Quick Test

Run this to test DNS resolution:
```powershell
nslookup db.dewurncddfkjrfulphww.supabase.co
ping db.dewurncddfkjrfulphww.supabase.co
```

If these fail, it's definitely a DNS issue.

## Most Likely Fix

**Use the Session Mode pooler connection string** - it uses a different hostname (`pooler.supabase.com`) that might resolve better.

