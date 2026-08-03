import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for drizzle-kit");
}

function parseConnectionString(url: string) {
  const cleanUrl = url.replace(/"/g, "").trim();
  
  // Regex to extract connection components (supports postgres:// and postgresql://)
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

const credentials = parseConnectionString(process.env.DATABASE_URL);

if (!credentials) {
  throw new Error("Invalid DATABASE_URL format. Expected: postgresql://user:pass@host:port/db");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    host: credentials.host,
    port: credentials.port,
    user: credentials.user,
    password: credentials.password,
    database: credentials.database,
    ssl: credentials.host.includes("supabase") || credentials.host.includes("neon")
      ? { rejectUnauthorized: false }
      : undefined,
  },
});
