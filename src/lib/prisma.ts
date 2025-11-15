import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

// Use DATABASE_URL for runtime queries (transaction pooler is fine here)
// For migrations, use DIRECT_DATABASE_URL (direct connection) in prisma.config.ts
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

export const prisma: PrismaClient =
  global.prismaGlobal ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : [],
    // Use DATABASE_URL (transaction pooler) for runtime queries
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  global.prismaGlobal = prisma;
}
