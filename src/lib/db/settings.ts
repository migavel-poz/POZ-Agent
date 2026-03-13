import { getDb, withTransaction } from "./index";

export async function getSetting(key: string): Promise<string | undefined> {
  const db = await getDb();
  const row = await db.query<{ value: string }>("SELECT value FROM app_settings WHERE key = $1", [key]);
  return row.rows[0]?.value;
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const db = await getDb();
  const rows = await db.query<{ key: string; value: string }>("SELECT key, value FROM app_settings");
  return Object.fromEntries(rows.rows.map((r) => [r.key, r.value]));
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.query(
    `
      INSERT INTO app_settings (key, value, updated_at) VALUES ($1, $2, NOW())
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = NOW()
    `,
    [key, value]
  );
}

export async function setMultipleSettings(settings: Record<string, string>): Promise<void> {
  await withTransaction(async (client) => {
    for (const [key, value] of Object.entries(settings)) {
      await client.query(
        `
          INSERT INTO app_settings (key, value, updated_at) VALUES ($1, $2, NOW())
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = NOW()
        `,
        [key, value]
      );
    }
  });
}
