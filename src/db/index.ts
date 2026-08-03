import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const rawDatabaseUrl = process.env.DATABASE_URL;

function parseConnectionString(url: string) {
  if (!url) return null;
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

const credentials = rawDatabaseUrl ? parseConnectionString(rawDatabaseUrl) : null;

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool(credentials ? {
    host: credentials.host,
    port: credentials.port,
    user: credentials.user,
    password: credentials.password,
    database: credentials.database,
    ssl: credentials.host.includes("supabase") || credentials.host.includes("neon")
      ? { rejectUnauthorized: false }
      : undefined,
  } : {
    connectionString: "postgresql://mock:mock@localhost:5432/mock"
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool, { schema });
