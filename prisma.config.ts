import { defineConfig } from "prisma/config";
import { config } from "dotenv";
import { resolve } from "path";

// Load .env file from project root
config({ path: resolve(process.cwd(), ".env") });

// For migrations, use DIRECT_DATABASE_URL if available (direct connection),
// otherwise fall back to DATABASE_URL (which should be the pooler for runtime)
// Transaction poolers don't support prepared statements needed for migrations
const migrationUrl = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL || "file:./dev.db";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: migrationUrl,
  },
});
