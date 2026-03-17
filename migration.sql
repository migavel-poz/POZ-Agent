-- POZ Social Media Agent - Complete Database Schema
-- This file contains the complete schema and migration for auth columns

-- =====================================================
-- FULL SCHEMA (for fresh databases)
-- =====================================================

-- Team Members table with auth columns
CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'member',
  auth_role TEXT NOT NULL DEFAULT 'employee',
  password_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Posts table
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

-- Post Revisions table
CREATE TABLE IF NOT EXISTS post_revisions (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  revised_by INTEGER NOT NULL REFERENCES team_members(id),
  revision_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Post Status History table
CREATE TABLE IF NOT EXISTS post_status_history (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by INTEGER NOT NULL REFERENCES team_members(id),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prompt Templates table
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

-- App Settings table
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agent Outputs table
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

-- =====================================================
-- MIGRATION for existing databases (idempotent)
-- =====================================================

-- Add auth columns to existing team_members table
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS auth_role TEXT NOT NULL DEFAULT 'employee';
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Post Comments table
CREATE TABLE IF NOT EXISTS post_comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id INTEGER NOT NULL REFERENCES team_members(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES team_members(id),
  type TEXT NOT NULL DEFAULT 'comment',
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_by INTEGER REFERENCES team_members(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled ON posts(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(post_type);
CREATE INDEX IF NOT EXISTS idx_revisions_post ON post_revisions(post_id);
CREATE INDEX IF NOT EXISTS idx_status_history_post ON post_status_history(post_id);
CREATE INDEX IF NOT EXISTS idx_agent_outputs_agent ON agent_outputs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_outputs_skill ON agent_outputs(skill_id);
CREATE INDEX IF NOT EXISTS idx_agent_outputs_created ON agent_outputs(created_at);
CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);

-- =====================================================
-- AUTH SEED DATA
-- =====================================================

-- Create default superadmin (password: admin123)
-- $2b$10$9QN8o3gFEogPdqdh7Qd1Ju.PaAq5j8WSOQ/JZnpwruro7hwq.Hd62 = bcrypt("admin123")
INSERT INTO team_members (name, email, role, auth_role, password_hash)
VALUES ('Admin', 'admin@poz.com', 'lead', 'superadmin', '$2b$10$9QN8o3gFEogPdqdh7Qd1Ju.PaAq5j8WSOQ/JZnpwruro7hwq.Hd62')
ON CONFLICT (email) DO UPDATE SET
  auth_role = 'superadmin',
  password_hash = COALESCE(team_members.password_hash, '$2b$10$9QN8o3gFEogPdqdh7Qd1Ju.PaAq5j8WSOQ/JZnpwruro7hwq.Hd62');

-- Set default passwords for existing team members without passwords (password: poz123)
-- $2b$10$YeNDQv8YbNE5u2Fqa9djFuGiHWv8CRvH5SKUOAYLHC7TLMOY67UsO = bcrypt("poz123")
UPDATE team_members
SET password_hash = '$2b$10$YeNDQv8YbNE5u2Fqa9djFuGiHWv8CRvH5SKUOAYLHC7TLMOY67UsO'
WHERE password_hash IS NULL AND email != 'admin@poz.com';

-- Set auth_role for existing users if not set
UPDATE team_members
SET auth_role = CASE
  WHEN email = 'admin@poz.com' THEN 'superadmin'
  WHEN email IN ('shweta@poz.ai') THEN 'admin'  -- Shweta as admin
  ELSE 'employee'
END
WHERE auth_role IS NULL OR auth_role = '';

-- =====================================================
-- DEFAULT SEED DATA (if tables are empty)
-- =====================================================

-- Seed team members (if none exist except admin)
INSERT INTO team_members (name, email, role, auth_role, password_hash) VALUES
  ('Shweta', 'shweta@poz.ai', 'lead', 'admin', '$2b$10$YeNDQv8YbNE5u2Fqa9djFuGiHWv8CRvH5SKUOAYLHC7TLMOY67UsO'),
  ('Miguel', 'miguel@poz.ai', 'member', 'employee', '$2b$10$YeNDQv8YbNE5u2Fqa9djFuGiHWv8CRvH5SKUOAYLHC7TLMOY67UsO'),
  ('Tejas', 'tejas@poz.ai', 'member', 'employee', '$2b$10$YeNDQv8YbNE5u2Fqa9djFuGiHWv8CRvH5SKUOAYLHC7TLMOY67UsO'),
  ('Boobesh', 'boobesh@poz.ai', 'member', 'employee', '$2b$10$YeNDQv8YbNE5u2Fqa9djFuGiHWv8CRvH5SKUOAYLHC7TLMOY67UsO'),
  ('Lakshman', 'lakshman@poz.ai', 'member', 'employee', '$2b$10$YeNDQv8YbNE5u2Fqa9djFuGiHWv8CRvH5SKUOAYLHC7TLMOY67UsO'),
  ('Rucha', 'rucha@poz.ai', 'designer', 'employee', '$2b$10$YeNDQv8YbNE5u2Fqa9djFuGiHWv8CRvH5SKUOAYLHC7TLMOY67UsO'),
  ('Karishma', 'karishma@poz.ai', 'designer', 'employee', '$2b$10$YeNDQv8YbNE5u2Fqa9djFuGiHWv8CRvH5SKUOAYLHC7TLMOY67UsO'),
  ('Sridhar', 'sridhar@poz.ai', 'member', 'employee', '$2b$10$YeNDQv8YbNE5u2Fqa9djFuGiHWv8CRvH5SKUOAYLHC7TLMOY67UsO'),
  ('Rajarajan', 'rajarajan@poz.ai', 'member', 'employee', '$2b$10$YeNDQv8YbNE5u2Fqa9djFuGiHWv8CRvH5SKUOAYLHC7TLMOY67UsO'),
  ('Shagita', 'shagita@poz.ai', 'member', 'employee', '$2b$10$YeNDQv8YbNE5u2Fqa9djFuGiHWv8CRvH5SKUOAYLHC7TLMOY67UsO')
ON CONFLICT (email) DO NOTHING;

-- Seed prompt templates (if none exist)
INSERT INTO prompt_templates (name, post_type, system_prompt, user_prompt_template, is_default)
SELECT * FROM (VALUES
  ('Default Problem-Solution', 'problem_solution',
   'You are a LinkedIn content strategist. Write engaging, professional posts with a strong hook, short readable paragraphs, and a clear CTA.',
   'Write a problem-solution LinkedIn post about: {{topic}}\n{{#if additional_context}}Additional context: {{additional_context}}{{/if}}', 1),
  ('Default Educational', 'educational',
   'You are a LinkedIn content strategist. Write educational posts with a surprising opening, clear structure, and actionable takeaways.',
   'Write an educational LinkedIn post about: {{topic}}\n{{#if additional_context}}Additional context: {{additional_context}}{{/if}}', 1),
  ('Default Execution/Build', 'execution',
   'You are a LinkedIn content strategist. Write build-in-public posts that include concrete decisions, progress updates, and lessons learned.',
   'Write a build-in-public LinkedIn post about: {{topic}}\n{{#if additional_context}}Additional context: {{additional_context}}{{/if}}', 1),
  ('Default Carousel', 'carousel',
   'You are a LinkedIn content strategist. Create concise carousel copy with one key point per slide and a strong CTA slide.',
   'Create a LinkedIn carousel about: {{topic}}\nNumber of slides: 6-8\n{{#if additional_context}}Additional context: {{additional_context}}{{/if}}', 1)
) AS v(name, post_type, system_prompt, user_prompt_template, is_default)
WHERE NOT EXISTS (SELECT 1 FROM prompt_templates);

-- Seed app settings (if none exist)
INSERT INTO app_settings (key, value)
SELECT * FROM (VALUES
  ('brand_name', 'POZ'),
  ('brand_voice', 'Professional yet approachable. We build AI-powered solutions and share our journey transparently.'),
  ('default_model', 'gpt-4o'),
  ('posts_per_week_target', '5')
) AS v(key, value)
WHERE NOT EXISTS (SELECT 1 FROM app_settings);

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================

-- Show current team members with their roles
-- SELECT name, email, role, auth_role, (password_hash IS NOT NULL) as has_password FROM team_members ORDER BY name;