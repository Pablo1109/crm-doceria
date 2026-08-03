import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for drizzle-kit");
}

const databaseUrl = process.env.DATABASE_URL.replace(/"/g, "").trim();

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url: databaseUrl,
    ssl: databaseUrl.includes("supabase") || databaseUrl.includes("neon")
      ? { rejectUnauthorized: false }
      : undefined,
  },
});
