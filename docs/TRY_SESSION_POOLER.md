# Try Session Mode Pooler for Migrations

Since the SQL Editor works but Prisma can't connect with the direct connection, let's try using the **Session Mode** connection pooler instead.

Session Mode supports prepared statements (unlike Transaction Mode), so it should work for migrations.

## Get Session Mode Connection String

1. Go to Supabase dashboard → Your project
2. **Settings** → **Database**
3. Scroll to **Connection pooling** section
4. Look for **Session mode** (not Transaction mode)
5. Copy the Session mode connection string

It should look like:
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

## Update .env

Replace `DIRECT_DATABASE_URL` with the Session Mode pooler URL:

```env
# Session mode pooler - supports prepared statements (good for migrations)
DIRECT_DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"

# Transaction mode pooler - for runtime queries
DATABASE_URL="postgresql://postgres.dewurncddfkjrfulphww:temi2474@aws-1-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
```

## Why This Might Work

- Session Mode pooler supports prepared statements (needed for migrations)
- It's designed for longer-lived connections
- It might have different network/firewall rules than direct connection
- It's still a pooler, so it's serverless-friendly

## Alternative: Check Firewall

If Session Mode doesn't work either, the issue is likely:
1. **Windows Firewall** blocking PostgreSQL connections
2. **Antivirus** blocking the connection
3. **Corporate/ISP firewall** blocking port 5432

To test:
- Temporarily disable Windows Firewall and try again
- Check Windows Defender or your antivirus logs
- Try from a different network (mobile hotspot)

