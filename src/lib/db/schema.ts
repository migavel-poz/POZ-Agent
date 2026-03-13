import { Pool } from "pg";

export async function initSchema(db: Pool): Promise<void> {
  await db.query(`
    CREATE TABLE IF NOT EXISTS team_members (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      role TEXT NOT NULL DEFAULT 'member',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      post_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      platform TEXT NOT NULL DEFAULT 'linkedin',
      author_id INTEGER NOT NULL REFERENCES team_members(id),
      assigned_designer_id INTEGER REFERENCES team_members(id),
      scheduled_date DATE,
      published_url TEXT,
      ai_prompt TEXT,
      ai_model TEXT,
      carousel_slides TEXT,
      hashtags TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS post_revisions (
      id SERIAL PRIMARY KEY,
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      revised_by INTEGER NOT NULL REFERENCES team_members(id),
      revision_type TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS post_status_history (
      id SERIAL PRIMARY KEY,
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      from_status TEXT,
      to_status TEXT NOT NULL,
      changed_by INTEGER NOT NULL REFERENCES team_members(id),
      note TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS prompt_templates (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      post_type TEXT NOT NULL,
      system_prompt TEXT NOT NULL,
      user_prompt_template TEXT NOT NULL,
      example_output TEXT,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_by INTEGER REFERENCES team_members(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS agent_outputs (
      id SERIAL PRIMARY KEY,
      agent_id TEXT NOT NULL,
      skill_id TEXT NOT NULL,
      title TEXT NOT NULL,
      input_params TEXT NOT NULL,
      output_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      created_by INTEGER NOT NULL REFERENCES team_members(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
    CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
    CREATE INDEX IF NOT EXISTS idx_posts_scheduled ON posts(scheduled_date);
    CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(post_type);
    CREATE INDEX IF NOT EXISTS idx_revisions_post ON post_revisions(post_id);
    CREATE INDEX IF NOT EXISTS idx_status_history_post ON post_status_history(post_id);
    CREATE INDEX IF NOT EXISTS idx_agent_outputs_agent ON agent_outputs(agent_id);
    CREATE INDEX IF NOT EXISTS idx_agent_outputs_skill ON agent_outputs(skill_id);
    CREATE INDEX IF NOT EXISTS idx_agent_outputs_created ON agent_outputs(created_at);
  `);

  await seedDefaults(db);
}

async function seedDefaults(db: Pool): Promise<void> {
  const memberCountResult = await db.query<{ count: number }>("SELECT COUNT(*)::int AS count FROM team_members");
  if (memberCountResult.rows[0]?.count === 0) {
    const members: Array<{ name: string; email: string; role: string }> = [
      { name: "Shweta", email: "shweta@poz.ai", role: "lead" },
      { name: "Miguel", email: "miguel@poz.ai", role: "member" },
      { name: "Tejas", email: "tejas@poz.ai", role: "member" },
      { name: "Boobesh", email: "boobesh@poz.ai", role: "member" },
      { name: "Lakshman", email: "lakshman@poz.ai", role: "member" },
      { name: "Rucha", email: "rucha@poz.ai", role: "designer" },
      { name: "Karishma", email: "karishma@poz.ai", role: "designer" },
      { name: "Sridhar", email: "sridhar@poz.ai", role: "member" },
      { name: "Rajarajan", email: "rajarajan@poz.ai", role: "member" },
      { name: "Shagita", email: "shagita@poz.ai", role: "member" },
    ];

    for (const member of members) {
      await db.query(
        "INSERT INTO team_members (name, email, role) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING",
        [member.name, member.email, member.role]
      );
    }
  }

  const templateCountResult = await db.query<{ count: number }>("SELECT COUNT(*)::int AS count FROM prompt_templates");
  if (templateCountResult.rows[0]?.count === 0) {
    const templates: Array<{ name: string; postType: string; systemPrompt: string; userPromptTemplate: string }> = [
      {
        name: "Default Problem-Solution",
        postType: "problem_solution",
        systemPrompt:
          "You are a LinkedIn content strategist. Write engaging, professional posts with a strong hook, short readable paragraphs, and a clear CTA.",
        userPromptTemplate:
          "Write a problem-solution LinkedIn post about: {{topic}}\n{{#if additional_context}}Additional context: {{additional_context}}{{/if}}",
      },
      {
        name: "Default Educational",
        postType: "educational",
        systemPrompt:
          "You are a LinkedIn content strategist. Write educational posts with a surprising opening, clear structure, and actionable takeaways.",
        userPromptTemplate:
          "Write an educational LinkedIn post about: {{topic}}\n{{#if additional_context}}Additional context: {{additional_context}}{{/if}}",
      },
      {
        name: "Default Execution/Build",
        postType: "execution",
        systemPrompt:
          "You are a LinkedIn content strategist. Write build-in-public posts that include concrete decisions, progress updates, and lessons learned.",
        userPromptTemplate:
          "Write a build-in-public LinkedIn post about: {{topic}}\n{{#if additional_context}}Additional context: {{additional_context}}{{/if}}",
      },
      {
        name: "Default Carousel",
        postType: "carousel",
        systemPrompt:
          "You are a LinkedIn content strategist. Create concise carousel copy with one key point per slide and a strong CTA slide.",
        userPromptTemplate:
          "Create a LinkedIn carousel about: {{topic}}\nNumber of slides: 6-8\n{{#if additional_context}}Additional context: {{additional_context}}{{/if}}",
      },
    ];

    for (const template of templates) {
      await db.query(
        `
          INSERT INTO prompt_templates (name, post_type, system_prompt, user_prompt_template, is_default)
          VALUES ($1, $2, $3, $4, 1)
        `,
        [template.name, template.postType, template.systemPrompt, template.userPromptTemplate]
      );
    }
  }

  const settingsCountResult = await db.query<{ count: number }>("SELECT COUNT(*)::int AS count FROM app_settings");
  if (settingsCountResult.rows[0]?.count === 0) {
    const settings: Array<{ key: string; value: string }> = [
      { key: "brand_name", value: "POZ" },
      {
        key: "brand_voice",
        value: "Professional yet approachable. We build AI-powered solutions and share our journey transparently.",
      },
      { key: "default_model", value: "gpt-4o" },
      { key: "posts_per_week_target", value: "5" },
    ];

    for (const setting of settings) {
      await db.query(
        "INSERT INTO app_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING",
        [setting.key, setting.value]
      );
    }
  }
}
