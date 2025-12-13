# Database Migration Guide - Quiz Mode Feature

## Issue
The automatic migration failed because your project uses PostgreSQL but has SQLite migration history.

## Solution Options

### Option 1: Push Schema Directly (Recommended for Development)

This will update your database schema without creating a migration file:

```bash
npx prisma db push
```

This is safe for development and will:
- Add `quizMode` field to the `Form` table
- Add `score` field to the `Submission` table
- Not affect existing data

### Option 2: Reset Migration History (⚠️ Deletes All Data)

If you want a clean migration history and don't mind losing data:

```bash
# This will DELETE ALL DATA and recreate the database
npx prisma migrate reset

# Then create a new migration
npx prisma migrate dev --name add_quiz_mode_and_scores
```

### Option 3: Manual SQL Migration

If you prefer to manually apply the changes:

```sql
-- Add quizMode to Form table
ALTER TABLE "Form" ADD COLUMN "quizMode" JSONB;

-- Add score to Submission table
ALTER TABLE "Submission" ADD COLUMN "score" JSONB;
```

Then update Prisma:
```bash
npx prisma generate
```

## Verification

After applying the migration, verify it worked:

```bash
# Check the schema is in sync
npx prisma validate

# Generate Prisma Client
npx prisma generate
```

## Testing

1. Start your development server:
```bash
npm run dev
```

2. Create a new form and enable quiz mode
3. Add fields with correct answers
4. Submit the form and verify scoring works

## Rollback (If Needed)

If something goes wrong, you can rollback:

```sql
-- Remove the new columns
ALTER TABLE "Form" DROP COLUMN IF EXISTS "quizMode";
ALTER TABLE "Submission" DROP COLUMN IF EXISTS "score";
```

## Production Deployment

For production, use:
```bash
npx prisma migrate deploy
```

This will apply pending migrations without prompting.

---

**Recommended Next Steps:**
1. Run `npx prisma db push` to apply schema changes
2. Run `npx prisma generate` to update Prisma Client
3. Restart your development server
4. Test the quiz feature!


