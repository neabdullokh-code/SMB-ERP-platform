import pg from "pg";
import { loadEnv, normalizeDatabaseUrl, isSupabasePoolerConnection, isDirectSupabaseConnection } from "@sqb/config";
import { seedDefaultProductionDataForTenant } from "../modules/production/seed.js";

const { Pool } = pg;

function createPool() {
  const env = loadEnv();
  const rawConnectionString = env.DATABASE_URL || env.DIRECT_DATABASE_URL;
  if (!rawConnectionString) {
    throw new Error("DATABASE_URL or DIRECT_DATABASE_URL is required to seed production data.");
  }
  const connectionString = normalizeDatabaseUrl(rawConnectionString);

  if (isSupabasePoolerConnection(connectionString) || isDirectSupabaseConnection(connectionString)) {
    const parsed = new URL(connectionString);
    const database = parsed.pathname.replace(/^\//, "") || "postgres";
    return new Pool({
      host: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : 5432,
      database,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      ssl: { rejectUnauthorized: false }
    });
  }

  return new Pool({ connectionString });
}

async function main() {
  const pool = createPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const tenantId = process.env.SEED_TENANT_ID
      || (await client.query<{ id: string }>(
        `select id
         from tenants
         where slug = $1
            or name = $2
         order by created_at asc
         limit 1`,
        ["kamolot-savdo", "Kamolot Savdo LLC"]
      )).rows[0]?.id
      || "tenant_kamolot";
    await seedDefaultProductionDataForTenant(client, tenantId);
    await client.query("COMMIT");
    console.log(`Seeded legacy production data for tenant ${tenantId}.`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
