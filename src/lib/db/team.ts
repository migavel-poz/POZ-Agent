import { getDb } from "./index";
import { TeamMember } from "../types";

export async function getAllTeamMembers(): Promise<TeamMember[]> {
  const db = await getDb();
  const result = await db.query<TeamMember>("SELECT * FROM team_members ORDER BY name ASC");
  return result.rows;
}

export async function getTeamMemberById(id: number): Promise<TeamMember | undefined> {
  const db = await getDb();
  const result = await db.query<TeamMember>("SELECT * FROM team_members WHERE id = $1", [id]);
  return result.rows[0];
}

export async function createTeamMember(data: { name: string; email?: string; role?: string }): Promise<TeamMember> {
  const db = await getDb();
  const result = await db.query<{ id: number }>(
    "INSERT INTO team_members (name, email, role) VALUES ($1, $2, $3) RETURNING id",
    [data.name, data.email || null, data.role || "member"]
  );
  return (await getTeamMemberById(result.rows[0].id))!;
}

export async function updateTeamMember(
  id: number,
  data: Partial<{ name: string; email: string; role: string }>
): Promise<TeamMember | undefined> {
  const db = await getDb();
  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      values.push(value);
      fields.push(`${key} = $${values.length}`);
    }
  }

  if (fields.length === 0) return getTeamMemberById(id);

  values.push(id);
  await db.query(`UPDATE team_members SET ${fields.join(", ")} WHERE id = $${values.length}`, values);
  return getTeamMemberById(id);
}

export async function deleteTeamMember(id: number): Promise<boolean> {
  const db = await getDb();
  const result = await db.query("DELETE FROM team_members WHERE id = $1", [id]);
  return (result.rowCount || 0) > 0;
}
