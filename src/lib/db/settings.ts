import { getDb } from "./index";

export function getSetting(key: string): string | undefined {
  const db = getDb();
  const row = db.prepare("SELECT value FROM app_settings WHERE key = ?").get(key) as { value: string } | undefined;
  return row?.value;
}

export function getAllSettings(): Record<string, string> {
  const db = getDb();
  const rows = db.prepare("SELECT key, value FROM app_settings").all() as { key: string; value: string }[];
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export function setSetting(key: string, value: string): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `).run(key, value);
}

export function setMultipleSettings(settings: Record<string, string>): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `);
  const transaction = db.transaction(() => {
    for (const [key, value] of Object.entries(settings)) {
      stmt.run(key, value);
    }
  });
  transaction();
}
