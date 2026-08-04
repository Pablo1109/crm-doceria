import { defineConfig } from "drizzle-kit";

function parseConnectionString(url: string) {
  if (!url) return null;
  const cleanUrl = url.replace(/"/g, "").trim();
  const regex = /^postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/;
  const match = cleanUrl.match(regex);
  if (!match) return null;
  return {
    user: match[1],
    password: decodeURIComponent(match[2]),
    host: match[3],
    port: parseInt(match[4], 10),
    database: match[5].split("?")[0]
  };
}

const credentials = process.env.DATABASE_URL
  ? parseConnectionString(process.env.DATABASE_URL)
  : null;

export default defineConfig({
  out: "./drizzle",
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: credentials
    ? {
        host: credentials.host,
        port: credentials.port,
        user: credentials.user,
        password: credentials.password,
        database: credentials.database,
        ssl:
          credentials.host.includes("supabase") ||
          credentials.host.includes("neon")
            ? { rejectUnauthorized: false }
            : undefined,
      }
    : { url: "postgresql://mock:mock@localhost:5432/mock" },
});
