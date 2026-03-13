import { getDb } from "./index";
import { TeamMember } from "../types";

export function getAllTeamMembers(): TeamMember[] {
  const db = getDb();
  return db.prepare("SELECT * FROM team_members ORDER BY name ASC").all() as TeamMember[];
}

export function getTeamMemberById(id: number): TeamMember | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM team_members WHERE id = ?").get(id) as TeamMember | undefined;
}

export function createTeamMember(data: { name: string; email?: string; role?: string }): TeamMember {
  const db = getDb();
  const result = db.prepare(
    "INSERT INTO team_members (name, email, role) VALUES (?, ?, ?)"
  ).run(data.name, data.email || null, data.role || "member");
  return getTeamMemberById(Number(result.lastInsertRowid))!;
}

export function updateTeamMember(id: number, data: Partial<{ name: string; email: string; role: string }>): TeamMember | undefined {
  const db = getDb();
  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fields.length === 0) return getTeamMemberById(id);
  values.push(id);
  db.prepare(`UPDATE team_members SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return getTeamMemberById(id);
}

export function deleteTeamMember(id: number): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM team_members WHERE id = ?").run(id);
  return result.changes > 0;
}
