import { getDb } from "./index";
import { AgentOutput } from "../agents/types";

export async function getAllOutputs(filters?: {
  agent_id?: string;
  skill_id?: string;
  status?: string;
  created_by?: number;
  search?: string;
}): Promise<AgentOutput[]> {
  const db = await getDb();
  let query = `
    SELECT ao.*, tm.name as created_by_name
    FROM agent_outputs ao
    LEFT JOIN team_members tm ON ao.created_by = tm.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (filters?.agent_id) {
    params.push(filters.agent_id);
    query += ` AND ao.agent_id = $${params.length}`;
  }
  if (filters?.skill_id) {
    params.push(filters.skill_id);
    query += ` AND ao.skill_id = $${params.length}`;
  }
  if (filters?.status) {
    params.push(filters.status);
    query += ` AND ao.status = $${params.length}`;
  }
  if (filters?.created_by) {
    params.push(filters.created_by);
    query += ` AND ao.created_by = $${params.length}`;
  }
  if (filters?.search) {
    const like = `%${filters.search}%`;
    params.push(like);
    const titleParam = params.length;
    params.push(like);
    const jsonParam = params.length;
    query += ` AND (ao.title ILIKE $${titleParam} OR ao.output_json ILIKE $${jsonParam})`;
  }

  query += " ORDER BY ao.created_at DESC";
  const result = await db.query<AgentOutput>(query, params);
  return result.rows;
}

export async function getOutputById(id: number): Promise<AgentOutput | undefined> {
  const db = await getDb();
  const result = await db.query<AgentOutput>(
    `SELECT ao.*, tm.name as created_by_name
     FROM agent_outputs ao
     LEFT JOIN team_members tm ON ao.created_by = tm.id
     WHERE ao.id = $1`,
    [id]
  );
  return result.rows[0];
}

export async function createOutput(data: {
  agent_id: string;
  skill_id: string;
  title: string;
  input_params: string;
  output_json: string;
  created_by: number;
}): Promise<AgentOutput> {
  const db = await getDb();
  const result = await db.query<{ id: number }>(
    `INSERT INTO agent_outputs (agent_id, skill_id, title, input_params, output_json, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [data.agent_id, data.skill_id, data.title, data.input_params, data.output_json, data.created_by]
  );

  return (await getOutputById(result.rows[0].id))!;
}

export async function updateOutput(
  id: number,
  data: Partial<{ title: string; output_json: string; status: string }>
): Promise<AgentOutput | undefined> {
  const db = await getDb();
  const fields: string[] = [];
  const params: unknown[] = [];

  if (data.title !== undefined) {
    params.push(data.title);
    fields.push(`title = $${params.length}`);
  }
  if (data.output_json !== undefined) {
    params.push(data.output_json);
    fields.push(`output_json = $${params.length}`);
  }
  if (data.status !== undefined) {
    params.push(data.status);
    fields.push(`status = $${params.length}`);
  }

  if (fields.length === 0) return getOutputById(id);

  fields.push("updated_at = NOW()");
  params.push(id);

  await db.query(`UPDATE agent_outputs SET ${fields.join(", ")} WHERE id = $${params.length}`, params);

  return getOutputById(id);
}

export async function deleteOutput(id: number): Promise<boolean> {
  const db = await getDb();
  const result = await db.query("DELETE FROM agent_outputs WHERE id = $1", [id]);
  return (result.rowCount || 0) > 0;
}
