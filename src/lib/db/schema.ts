import Database from "better-sqlite3";

export function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      role TEXT NOT NULL DEFAULT 'member',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      post_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      platform TEXT NOT NULL DEFAULT 'linkedin',
      author_id INTEGER NOT NULL REFERENCES team_members(id),
      assigned_designer_id INTEGER REFERENCES team_members(id),
      scheduled_date TEXT,
      published_url TEXT,
      ai_prompt TEXT,
      ai_model TEXT,
      carousel_slides TEXT,
      hashtags TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS post_revisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      revised_by INTEGER NOT NULL REFERENCES team_members(id),
      revision_type TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS post_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      from_status TEXT,
      to_status TEXT NOT NULL,
      changed_by INTEGER NOT NULL REFERENCES team_members(id),
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS prompt_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      post_type TEXT NOT NULL,
      system_prompt TEXT NOT NULL,
      user_prompt_template TEXT NOT NULL,
      example_output TEXT,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_by INTEGER REFERENCES team_members(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
    CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
    CREATE INDEX IF NOT EXISTS idx_posts_scheduled ON posts(scheduled_date);
    CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(post_type);
    CREATE INDEX IF NOT EXISTS idx_revisions_post ON post_revisions(post_id);
    CREATE INDEX IF NOT EXISTS idx_status_history_post ON post_status_history(post_id);

    CREATE TABLE IF NOT EXISTS agent_outputs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id TEXT NOT NULL,
      skill_id TEXT NOT NULL,
      title TEXT NOT NULL,
      input_params TEXT NOT NULL,
      output_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      created_by INTEGER NOT NULL REFERENCES team_members(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_agent_outputs_agent ON agent_outputs(agent_id);
    CREATE INDEX IF NOT EXISTS idx_agent_outputs_skill ON agent_outputs(skill_id);
    CREATE INDEX IF NOT EXISTS idx_agent_outputs_created ON agent_outputs(created_at);
  `);

  seedDefaults(db);
}

function seedDefaults(db: Database.Database) {
  const memberCount = db.prepare("SELECT COUNT(*) as count FROM team_members").get() as { count: number };
  if (memberCount.count === 0) {
    const insert = db.prepare("INSERT INTO team_members (name, email, role) VALUES (?, ?, ?)");
    insert.run("Shweta", "shweta@poz.ai", "lead");
    insert.run("Miguel", "miguel@poz.ai", "member");
    insert.run("Tejas", "tejas@poz.ai", "member");
    insert.run("Boobesh", "boobesh@poz.ai", "member");
    insert.run("Lakshman", "lakshman@poz.ai", "member");
    insert.run("Rucha", "rucha@poz.ai", "designer");
    insert.run("Karishma", "karishma@poz.ai", "designer");
    insert.run("Sridhar", "sridhar@poz.ai", "member");
    insert.run("Rajarajan", "rajarajan@poz.ai", "member");
    insert.run("Shagita", "shagita@poz.ai", "member");
  }

  const templateCount = db.prepare("SELECT COUNT(*) as count FROM prompt_templates").get() as { count: number };
  if (templateCount.count === 0) {
    const insert = db.prepare(
      "INSERT INTO prompt_templates (name, post_type, system_prompt, user_prompt_template, is_default) VALUES (?, ?, ?, ?, 1)"
    );

    insert.run(
      "Default Problem-Solution",
      "problem_solution",
      `You are a LinkedIn content strategist. Write engaging, professional LinkedIn posts.
Writing rules:
- Keep paragraphs to 1-2 lines maximum
- Use line breaks generously for readability
- Start with a bold hook that stops the scroll
- Write conversationally, not formally
- Use emojis sparingly (1-3 per post maximum)
- End with a clear call-to-action or thought-provoking question
- Target 150-300 words
- Include 3-5 relevant hashtags at the end

You are writing a Problem-Solution post:
1. Open by naming a specific, relatable problem
2. Agitate the problem — why it matters, what it costs
3. Present a clear solution or framework
4. Close with a takeaway or question`,
      `Write a problem-solution LinkedIn post about: {{topic}}
{{#if additional_context}}Additional context: {{additional_context}}{{/if}}`
    );

    insert.run(
      "Default Educational",
      "educational",
      `You are a LinkedIn content strategist. Write engaging, professional LinkedIn posts.
Writing rules:
- Keep paragraphs to 1-2 lines maximum
- Use line breaks generously for readability
- Start with a bold hook that stops the scroll
- Write conversationally, not formally
- Use emojis sparingly (1-3 per post maximum)
- End with a clear call-to-action or thought-provoking question
- Target 150-300 words
- Include 3-5 relevant hashtags at the end

You are writing an Educational post:
1. Open with a surprising insight or counterintuitive fact
2. Teach a concept, framework, or methodology
3. Use numbered lists or bullet points for structure
4. Provide actionable takeaways`,
      `Write an educational LinkedIn post about: {{topic}}
{{#if additional_context}}Additional context: {{additional_context}}{{/if}}`
    );

    insert.run(
      "Default Execution/Build",
      "execution",
      `You are a LinkedIn content strategist. Write engaging, professional LinkedIn posts.
Writing rules:
- Keep paragraphs to 1-2 lines maximum
- Use line breaks generously for readability
- Start with a bold hook that stops the scroll
- Write conversationally, not formally
- Use emojis sparingly (1-3 per post maximum)
- End with a clear call-to-action or thought-provoking question
- Target 150-300 words
- Include 3-5 relevant hashtags at the end

You are writing an Execution-Led / Build-in-Public post:
1. Open with what you're building or working on right now
2. Share a specific challenge and how it was approached
3. Include concrete details — numbers, timelines, decisions
4. Close with a lesson learned or what comes next`,
      `Write a build-in-public LinkedIn post about: {{topic}}
{{#if additional_context}}Additional context: {{additional_context}}{{/if}}`
    );

    insert.run(
      "Default Carousel",
      "carousel",
      `You are a LinkedIn content strategist. Write engaging, professional LinkedIn carousel posts.
Writing rules:
- Slide 1: Bold headline that creates curiosity (the cover slide)
- Slides 2-8: One key point per slide with a headline and short supporting text
- Final slide: Summary + strong CTA with brand name
- Caption: A compelling LinkedIn caption that introduces the carousel
- Keep text per slide under 50 words
- Include visual suggestions for each slide

Return the response as a JSON object with these fields:
- title: cover slide headline
- slides: array of {slideNumber, headline, bodyText, visualSuggestion}
- closingSlide: {headline, callToAction}
- captionText: the LinkedIn caption text
- hashtags: array of hashtag strings`,
      `Create a LinkedIn carousel about: {{topic}}
Number of slides: 6-8
{{#if additional_context}}Additional context: {{additional_context}}{{/if}}`
    );
  }

  const settingsCount = db.prepare("SELECT COUNT(*) as count FROM app_settings").get() as { count: number };
  if (settingsCount.count === 0) {
    const insert = db.prepare("INSERT INTO app_settings (key, value) VALUES (?, ?)");
    insert.run("brand_name", "POZ");
    insert.run("brand_voice", "Professional yet approachable. We build AI-powered solutions and share our journey transparently.");
    insert.run("default_model", "gpt-4o");
    insert.run("posts_per_week_target", "5");
  }
}
