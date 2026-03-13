import { getDb } from "./index";
import { PromptTemplate, PostType } from "../types";

export function getAllTemplates(): PromptTemplate[] {
  const db = getDb();
  return db.prepare("SELECT * FROM prompt_templates ORDER BY post_type, name").all() as PromptTemplate[];
}

export function getTemplatesByType(postType: PostType): PromptTemplate[] {
  const db = getDb();
  return db.prepare("SELECT * FROM prompt_templates WHERE post_type = ? ORDER BY is_default DESC, name").all(postType) as PromptTemplate[];
}

export function getDefaultTemplate(postType: PostType): PromptTemplate | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM prompt_templates WHERE post_type = ? AND is_default = 1").get(postType) as PromptTemplate | undefined;
}

export function getTemplateById(id: number): PromptTemplate | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM prompt_templates WHERE id = ?").get(id) as PromptTemplate | undefined;
}

export function createTemplate(data: {
  name: string;
  post_type: PostType;
  system_prompt: string;
  user_prompt_template: string;
  example_output?: string;
  is_default?: boolean;
  created_by?: number;
}): PromptTemplate {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO prompt_templates (name, post_type, system_prompt, user_prompt_template, example_output, is_default, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.name,
    data.post_type,
    data.system_prompt,
    data.user_prompt_template,
    data.example_output || null,
    data.is_default ? 1 : 0,
    data.created_by || null
  );
  return getTemplateById(Number(result.lastInsertRowid))!;
}

export function updateTemplate(id: number, data: Partial<{
  name: string;
  system_prompt: string;
  user_prompt_template: string;
  example_output: string;
  is_default: boolean;
}>): PromptTemplate | undefined {
  const db = getDb();
  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      if (key === "is_default") {
        fields.push(`${key} = ?`);
        values.push(value ? 1 : 0);
      } else {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
  }

  if (fields.length === 0) return getTemplateById(id);
  fields.push("updated_at = datetime('now')");
  values.push(id);
  db.prepare(`UPDATE prompt_templates SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return getTemplateById(id);
}

export function deleteTemplate(id: number): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM prompt_templates WHERE id = ?").run(id);
  return result.changes > 0;
}
