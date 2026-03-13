import { getDb } from "./index";
import { PromptTemplate, PostType } from "../types";

export async function getAllTemplates(): Promise<PromptTemplate[]> {
  const db = await getDb();
  const result = await db.query<PromptTemplate>("SELECT * FROM prompt_templates ORDER BY post_type, name");
  return result.rows;
}

export async function getTemplatesByType(postType: PostType): Promise<PromptTemplate[]> {
  const db = await getDb();
  const result = await db.query<PromptTemplate>(
    "SELECT * FROM prompt_templates WHERE post_type = $1 ORDER BY is_default DESC, name",
    [postType]
  );
  return result.rows;
}

export async function getDefaultTemplate(postType: PostType): Promise<PromptTemplate | undefined> {
  const db = await getDb();
  const result = await db.query<PromptTemplate>(
    "SELECT * FROM prompt_templates WHERE post_type = $1 AND is_default = 1",
    [postType]
  );
  return result.rows[0];
}

export async function getTemplateById(id: number): Promise<PromptTemplate | undefined> {
  const db = await getDb();
  const result = await db.query<PromptTemplate>("SELECT * FROM prompt_templates WHERE id = $1", [id]);
  return result.rows[0];
}

export async function createTemplate(data: {
  name: string;
  post_type: PostType;
  system_prompt: string;
  user_prompt_template: string;
  example_output?: string;
  is_default?: boolean;
  created_by?: number;
}): Promise<PromptTemplate> {
  const db = await getDb();
  const result = await db.query<{ id: number }>(`
    INSERT INTO prompt_templates (name, post_type, system_prompt, user_prompt_template, example_output, is_default, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id
  `, [
    data.name,
    data.post_type,
    data.system_prompt,
    data.user_prompt_template,
    data.example_output || null,
    data.is_default ? 1 : 0,
    data.created_by || null,
  ]);
  return (await getTemplateById(result.rows[0].id))!;
}

export async function updateTemplate(id: number, data: Partial<{
  name: string;
  system_prompt: string;
  user_prompt_template: string;
  example_output: string;
  is_default: boolean;
}>): Promise<PromptTemplate | undefined> {
  const db = await getDb();
  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      if (key === "is_default") {
        values.push(value ? 1 : 0);
        fields.push(`${key} = $${values.length}`);
      } else {
        values.push(value);
        fields.push(`${key} = $${values.length}`);
      }
    }
  }

  if (fields.length === 0) return getTemplateById(id);
  fields.push("updated_at = NOW()");
  values.push(id);
  await db.query(`UPDATE prompt_templates SET ${fields.join(", ")} WHERE id = $${values.length}`, values);
  return getTemplateById(id);
}

export async function deleteTemplate(id: number): Promise<boolean> {
  const db = await getDb();
  const result = await db.query("DELETE FROM prompt_templates WHERE id = $1", [id]);
  return (result.rowCount || 0) > 0;
}
