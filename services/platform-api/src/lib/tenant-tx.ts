import type { PoolClient } from "pg";
import { withDb } from "./db.js";

/**
 * Run `operation` inside a transaction with the Postgres session variable
 * `app.tenant_id` pinned for the lifetime of the transaction. That session
 * variable is what the RLS policies in `001_initial_schema.sql` and
 * `008_finance_rls.sql` read from, so setting it here turns RLS from a dormant
 * declaration into an actively enforced defense-in-depth against cross-tenant
 * leakage. Every operational write path must go through this helper (or
 * `withGlobalTx` for the SuperAdmin / BankAdmin surface).
 *
 * Returns `null` only when the database is unavailable AND the fixture
 * fallback is allowed (ALLOW_DEMO_AUTH); callers that need a mandatory
 * database must treat `null` the same way they would treat an unavailable
 * finance store and surface a 503.
 */
export async function withTenantTx<T>(
  tenantId: string,
  operation: (client: PoolClient) => Promise<T>
): Promise<T | null> {
  if (!tenantId) {
    throw new Error("withTenantTx requires a tenantId");
  }

  return withDb(async (pool) => {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      // Postgres SET LOCAL does not accept bind parameters for the value, so
      // we use set_config(name, value, is_local=true) which does.
      await client.query(`select set_config('app.tenant_id', $1, true)`, [tenantId]);
      const result = await operation(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // swallow rollback errors so the original error surfaces
      }
      throw error;
    } finally {
      client.release();
    }
  });
}

/**
 * Global (non-tenant) transaction for SuperAdmin and BankAdmin surfaces that
 * legitimately need cross-tenant reads. Clears `app.tenant_id` so RLS policies
 * that check for equality with `current_setting('app.tenant_id', true)` do NOT
 * match any tenant row; cross-tenant access must be granted explicitly via
 * role or `security definer` functions.
 */
export async function withGlobalTx<T>(
  operation: (client: PoolClient) => Promise<T>
): Promise<T | null> {
  return withDb(async (pool) => {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      await client.query(`select set_config('app.tenant_id', '', true)`);
      const result = await operation(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // swallow
      }
      throw error;
    } finally {
      client.release();
    }
  });
}
