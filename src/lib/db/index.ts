import { Pool, PoolClient } from "pg";
import { initSchema } from "./schema";

let db: Pool | null = null;
let initPromise: Promise<void> | null = null;

function getConnectionString(): string {
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing POSTGRES_URL or DATABASE_URL environment variable");
  }
  return connectionString;
}

export async function getDb(): Promise<Pool> {
  if (!db) {
    db = new Pool({ connectionString: getConnectionString() });
    initPromise = initSchema(db);
  }

  if (initPromise) {
    await initPromise;
  }

  return db;
}

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const pool = await getDb();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
