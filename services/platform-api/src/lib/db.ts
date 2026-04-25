import pg from "pg";
import { loadEnv } from "@sqb/config";

const { Pool } = pg;

let pool: pg.Pool | null = null;
let warnedUnavailable = false;

function getPool() {
  if (!pool) {
    const env = loadEnv();
    pool = new Pool({
      connectionString: env.DATABASE_URL
    });
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
