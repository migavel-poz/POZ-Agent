import { getDb } from "./index";
import { Post, PostRevision, PostStatusHistory, PostStatus, PostType } from "../types";

export function getAllPosts(filters?: {
  status?: PostStatus;
  post_type?: PostType;
  author_id?: number;
  search?: string;
}): Post[] {
  const db = getDb();
  let query = `
    SELECT p.*, tm.name as author_name, d.name as designer_name
    FROM posts p
    JOIN team_members tm ON p.author_id = tm.id
    LEFT JOIN team_members d ON p.assigned_designer_id = d.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (filters?.status) {
    query += " AND p.status = ?";
    params.push(filters.status);
  }
  if (filters?.post_type) {
    query += " AND p.post_type = ?";
    params.push(filters.post_type);
  }
  if (filters?.author_id) {
    query += " AND p.author_id = ?";
    params.push(filters.author_id);
  }
  if (filters?.search) {
    query += " AND (p.title LIKE ? OR p.content LIKE ?)";
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  query += " ORDER BY p.updated_at DESC";
  return db.prepare(query).all(...params) as Post[];
}

export function getPostById(id: number): Post | undefined {
  const db = getDb();
  return db.prepare(`
    SELECT p.*, tm.name as author_name, d.name as designer_name
    FROM posts p
    JOIN team_members tm ON p.author_id = tm.id
    LEFT JOIN team_members d ON p.assigned_designer_id = d.id
    WHERE p.id = ?
  `).get(id) as Post | undefined;
}

export function createPost(data: {
  title: string;
  content: string;
  post_type: PostType;
  author_id: number;
  platform?: string;
  ai_prompt?: string;
  ai_model?: string;
  carousel_slides?: string;
  hashtags?: string;
  scheduled_date?: string;
}): Post {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO posts (title, content, post_type, author_id, platform, ai_prompt, ai_model, carousel_slides, hashtags, scheduled_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.title,
    data.content,
    data.post_type,
    data.author_id,
    data.platform || "linkedin",
    data.ai_prompt || null,
    data.ai_model || null,
    data.carousel_slides || null,
    data.hashtags || null,
    data.scheduled_date || null
  );

  // Log initial status
  db.prepare(`
    INSERT INTO post_status_history (post_id, from_status, to_status, changed_by)
    VALUES (?, NULL, 'draft', ?)
  `).run(result.lastInsertRowid, data.author_id);

  // Save first revision
  db.prepare(`
    INSERT INTO post_revisions (post_id, content, revised_by, revision_type)
    VALUES (?, ?, ?, 'ai_generated')
  `).run(result.lastInsertRowid, data.content, data.author_id);

  return getPostById(Number(result.lastInsertRowid))!;
}

export function updatePost(id: number, data: Partial<{
  title: string;
  content: string;
  scheduled_date: string | null;
  assigned_designer_id: number | null;
  hashtags: string | null;
  notes: string | null;
  published_url: string | null;
  carousel_slides: string | null;
}>): Post | undefined {
  const db = getDb();
  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fields.length === 0) return getPostById(id);

  fields.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE posts SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return getPostById(id);
}

export function deletePost(id: number): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM posts WHERE id = ?").run(id);
  return result.changes > 0;
}

export function transitionPostStatus(
  id: number,
  newStatus: PostStatus,
  changedBy: number,
  note?: string
): Post | undefined {
  const db = getDb();
  const post = getPostById(id);
  if (!post) return undefined;

  db.prepare("UPDATE posts SET status = ?, updated_at = datetime('now') WHERE id = ?").run(newStatus, id);

  db.prepare(`
    INSERT INTO post_status_history (post_id, from_status, to_status, changed_by, note)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, post.status, newStatus, changedBy, note || null);

  return getPostById(id);
}

export function addRevision(postId: number, content: string, revisedBy: number, type: string): PostRevision {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO post_revisions (post_id, content, revised_by, revision_type)
    VALUES (?, ?, ?, ?)
  `).run(postId, content, revisedBy, type);
  return db.prepare("SELECT * FROM post_revisions WHERE id = ?").get(result.lastInsertRowid) as PostRevision;
}

export function getRevisions(postId: number): PostRevision[] {
  const db = getDb();
  return db.prepare(`
    SELECT pr.*, tm.name as revised_by_name
    FROM post_revisions pr
    JOIN team_members tm ON pr.revised_by = tm.id
    WHERE pr.post_id = ?
    ORDER BY pr.created_at DESC
  `).all(postId) as PostRevision[];
}

export function getStatusHistory(postId: number): PostStatusHistory[] {
  const db = getDb();
  return db.prepare(`
    SELECT psh.*, tm.name as changed_by_name
    FROM post_status_history psh
    JOIN team_members tm ON psh.changed_by = tm.id
    WHERE psh.post_id = ?
    ORDER BY psh.created_at DESC
  `).all(postId) as PostStatusHistory[];
}

export function getPostsByWeek(weekStart: string): Post[] {
  const db = getDb();
  return db.prepare(`
    SELECT p.*, tm.name as author_name, d.name as designer_name
    FROM posts p
    JOIN team_members tm ON p.author_id = tm.id
    LEFT JOIN team_members d ON p.assigned_designer_id = d.id
    WHERE p.scheduled_date >= ? AND p.scheduled_date < date(?, '+7 days')
    ORDER BY p.scheduled_date ASC
  `).all(weekStart, weekStart) as Post[];
}

export function getDashboardStats() {
  const db = getDb();

  const totalPosts = (db.prepare("SELECT COUNT(*) as count FROM posts").get() as { count: number }).count;

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1);
  const weekStartStr = weekStart.toISOString().split("T")[0];
  const postsThisWeek = (db.prepare(
    "SELECT COUNT(*) as count FROM posts WHERE created_at >= ?"
  ).get(weekStartStr) as { count: number }).count;

  const inPipeline = (db.prepare(
    "SELECT COUNT(*) as count FROM posts WHERE status NOT IN ('draft', 'published')"
  ).get() as { count: number }).count;

  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const publishedThisMonth = (db.prepare(
    "SELECT COUNT(*) as count FROM posts WHERE status = 'published' AND updated_at >= ?"
  ).get(monthStart) as { count: number }).count;

  const statusCounts = db.prepare(
    "SELECT status, COUNT(*) as count FROM posts GROUP BY status"
  ).all() as { status: string; count: number }[];

  const typeCounts = db.prepare(
    "SELECT post_type, COUNT(*) as count FROM posts GROUP BY post_type"
  ).all() as { post_type: string; count: number }[];

  const teamContributions = db.prepare(`
    SELECT tm.name,
      COUNT(CASE WHEN p.id IS NOT NULL THEN 1 END) as posts_created,
      COUNT(CASE WHEN p.status = 'published' THEN 1 END) as posts_published
    FROM team_members tm
    LEFT JOIN posts p ON p.author_id = tm.id
    GROUP BY tm.id
    ORDER BY posts_created DESC
  `).all() as { name: string; posts_created: number; posts_published: number }[];

  const recentActivity = db.prepare(`
    SELECT psh.*, tm.name as changed_by_name
    FROM post_status_history psh
    JOIN team_members tm ON psh.changed_by = tm.id
    ORDER BY psh.created_at DESC
    LIMIT 10
  `).all() as PostStatusHistory[];

  return {
    totalPosts,
    postsThisWeek,
    inPipeline,
    publishedThisMonth,
    postsByStatus: Object.fromEntries(statusCounts.map((s) => [s.status, s.count])),
    postsByType: Object.fromEntries(typeCounts.map((t) => [t.post_type, t.count])),
    teamContributions,
    recentActivity,
  };
}
