import pg from "pg";
import { isDirectSupabaseConnection, isSupabasePoolerConnection, loadEnv, normalizeDatabaseUrl } from "@sqb/config";

const { Pool } = pg;

let pool: pg.Pool | null = null;
let warnedUnavailable = false;
let warnedDirectSupabase = false;

function getPool() {
  if (!pool) {
    const env = loadEnv();
    if (!warnedDirectSupabase && isDirectSupabaseConnection(env.DATABASE_URL)) {
      warnedDirectSupabase = true;
      console.warn("DATABASE_URL is using Supabase direct Postgres on db.<project-ref>.supabase.co:5432. This route is IPv6-only by default. For application traffic on IPv4 networks, switch DATABASE_URL to the Supabase session pooler and keep DIRECT_DATABASE_URL for migrations.");
    }
    const connectionString = normalizeDatabaseUrl(env.DATABASE_URL);
    if (isSupabasePoolerConnection(connectionString)) {
      const parsed = new URL(connectionString);
      const database = parsed.pathname.replace(/^\//, "") || "postgres";
      pool = new Pool({
        host: parsed.hostname,
        port: parsed.port ? Number(parsed.port) : 5432,
        database,
        user: decodeURIComponent(parsed.username),
        password: decodeURIComponent(parsed.password),
        ssl: { rejectUnauthorized: false }
      });
    } else {
      pool = new Pool({
        connectionString
      });
    }
  }

  return pool;
}

function shouldTreatAsUnavailable(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return [
    "ECONNREFUSED",
    "ENOTFOUND",
    "ETIMEDOUT",
    "57P01",
    "28P01",
    "3D000",
    "42P01",
    "42703"
  ].includes((error as Error & { code?: string }).code ?? "");
}

export async function withDb<T>(run: (pool: pg.Pool) => Promise<T>): Promise<T | null> {
  try {
    return await run(getPool());
  } catch (error) {
    if (shouldTreatAsUnavailable(error) && loadEnv().ALLOW_DEMO_AUTH) {
      if (!warnedUnavailable) {
        warnedUnavailable = true;
        const code = error instanceof Error ? (error as Error & { code?: string }).code ?? "unknown" : "unknown";
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`PostgreSQL unavailable, falling back to in-memory auth/workspace store. code=${code} message=${message}`);
      }
      return null;
    }

    throw error;
  }
}
