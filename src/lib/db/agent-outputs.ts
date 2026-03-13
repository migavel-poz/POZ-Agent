import { getDb } from "./index";
import { AgentOutput } from "../agents/types";

export function getAllOutputs(filters?: {
  agent_id?: string;
  skill_id?: string;
  status?: string;
  created_by?: number;
  search?: string;
}): AgentOutput[] {
  const db = getDb();
  let query = `
    SELECT ao.*, tm.name as created_by_name
    FROM agent_outputs ao
    LEFT JOIN team_members tm ON ao.created_by = tm.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (filters?.agent_id) {
    query += " AND ao.agent_id = ?";
    params.push(filters.agent_id);
  }
  if (filters?.skill_id) {
    query += " AND ao.skill_id = ?";
    params.push(filters.skill_id);
  }
  if (filters?.status) {
    query += " AND ao.status = ?";
    params.push(filters.status);
  }
  if (filters?.created_by) {
    query += " AND ao.created_by = ?";
    params.push(filters.created_by);
  }
  if (filters?.search) {
    query += " AND (ao.title LIKE ? OR ao.output_json LIKE ?)";
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  query += " ORDER BY ao.created_at DESC";

  return db.prepare(query).all(...params) as AgentOutput[];
}

export function getOutputById(id: number): AgentOutput | undefined {
  const db = getDb();
  return db
    .prepare(
      `SELECT ao.*, tm.name as created_by_name
       FROM agent_outputs ao
       LEFT JOIN team_members tm ON ao.created_by = tm.id
       WHERE ao.id = ?`
    )
    .get(id) as AgentOutput | undefined;
}

export function createOutput(data: {
  agent_id: string;
  skill_id: string;
  title: string;
  input_params: string;
  output_json: string;
  created_by: number;
}): AgentOutput {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO agent_outputs (agent_id, skill_id, title, input_params, output_json, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.agent_id,
      data.skill_id,
      data.title,
      data.input_params,
      data.output_json,
      data.created_by
    );

  return getOutputById(Number(result.lastInsertRowid))!;
}

export function updateOutput(
  id: number,
  data: Partial<{ title: string; output_json: string; status: string }>
): AgentOutput | undefined {
  const db = getDb();
  const fields: string[] = [];
  const params: unknown[] = [];

  if (data.title !== undefined) {
    fields.push("title = ?");
    params.push(data.title);
  }
  if (data.output_json !== undefined) {
    fields.push("output_json = ?");
    params.push(data.output_json);
  }
  if (data.status !== undefined) {
    fields.push("status = ?");
    params.push(data.status);
  }

  if (fields.length === 0) return getOutputById(id);

  fields.push("updated_at = datetime('now')");
  params.push(id);

  db.prepare(`UPDATE agent_outputs SET ${fields.join(", ")} WHERE id = ?`).run(
    ...params
  );

  return getOutputById(id);
}

export function deleteOutput(id: number): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM agent_outputs WHERE id = ?").run(id);
  return result.changes > 0;
}
