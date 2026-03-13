import { getDb } from "./index";
import { Post, PostRevision, PostStatusHistory, PostStatus, PostType } from "../types";

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getAllPosts(filters?: {
  status?: PostStatus;
  post_type?: PostType;
  author_id?: number;
  search?: string;
}): Promise<Post[]> {
  const db = await getDb();
  let query = `
    SELECT p.*, tm.name as author_name, d.name as designer_name
    FROM posts p
    JOIN team_members tm ON p.author_id = tm.id
    LEFT JOIN team_members d ON p.assigned_designer_id = d.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (filters?.status) {
    params.push(filters.status);
    query += ` AND p.status = $${params.length}`;
  }
  if (filters?.post_type) {
    params.push(filters.post_type);
    query += ` AND p.post_type = $${params.length}`;
  }
  if (filters?.author_id) {
    params.push(filters.author_id);
    query += ` AND p.author_id = $${params.length}`;
  }
  if (filters?.search) {
    const like = `%${filters.search}%`;
    params.push(like);
    const titleParam = params.length;
    params.push(like);
    const contentParam = params.length;
    query += ` AND (p.title ILIKE $${titleParam} OR p.content ILIKE $${contentParam})`;
  }

  query += " ORDER BY p.updated_at DESC";
  const result = await db.query<Post>(query, params);
  return result.rows;
}

export async function getPostById(id: number): Promise<Post | undefined> {
  const db = await getDb();
  const result = await db.query<Post>(`
    SELECT p.*, tm.name as author_name, d.name as designer_name
    FROM posts p
    JOIN team_members tm ON p.author_id = tm.id
    LEFT JOIN team_members d ON p.assigned_designer_id = d.id
    WHERE p.id = $1
  `, [id]);
  return result.rows[0];
}

export async function createPost(data: {
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
}): Promise<Post> {
  const db = await getDb();
  const result = await db.query<{ id: number }>(`
    INSERT INTO posts (title, content, post_type, author_id, platform, ai_prompt, ai_model, carousel_slides, hashtags, scheduled_date)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id
  `, [
    data.title,
    data.content,
    data.post_type,
    data.author_id,
    data.platform || "linkedin",
    data.ai_prompt || null,
    data.ai_model || null,
    data.carousel_slides || null,
    data.hashtags || null,
    data.scheduled_date || null,
  ]);

  const postId = result.rows[0].id;

  await db.query(`
    INSERT INTO post_status_history (post_id, from_status, to_status, changed_by)
    VALUES ($1, NULL, 'draft', $2)
  `, [postId, data.author_id]);

  await db.query(`
    INSERT INTO post_revisions (post_id, content, revised_by, revision_type)
    VALUES ($1, $2, $3, 'ai_generated')
  `, [postId, data.content, data.author_id]);

  return (await getPostById(postId))!;
}

export async function updatePost(id: number, data: Partial<{
  title: string;
  content: string;
  scheduled_date: string | null;
  assigned_designer_id: number | null;
  hashtags: string | null;
  notes: string | null;
  published_url: string | null;
  carousel_slides: string | null;
}>): Promise<Post | undefined> {
  const db = await getDb();
  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      values.push(value);
      fields.push(`${key} = $${values.length}`);
    }
  }

  if (fields.length === 0) return getPostById(id);

  fields.push("updated_at = NOW()");
  values.push(id);

  await db.query(`UPDATE posts SET ${fields.join(", ")} WHERE id = $${values.length}`, values);
  return getPostById(id);
}

export async function deletePost(id: number): Promise<boolean> {
  const db = await getDb();
  const result = await db.query("DELETE FROM posts WHERE id = $1", [id]);
  return (result.rowCount || 0) > 0;
}

export async function transitionPostStatus(
  id: number,
  newStatus: PostStatus,
  changedBy: number,
  note?: string
): Promise<Post | undefined> {
  const db = await getDb();
  const post = await getPostById(id);
  if (!post) return undefined;

  await db.query("UPDATE posts SET status = $1, updated_at = NOW() WHERE id = $2", [newStatus, id]);

  await db.query(`
    INSERT INTO post_status_history (post_id, from_status, to_status, changed_by, note)
    VALUES ($1, $2, $3, $4, $5)
  `, [id, post.status, newStatus, changedBy, note || null]);

  return getPostById(id);
}

export async function addRevision(postId: number, content: string, revisedBy: number, type: string): Promise<PostRevision> {
  const db = await getDb();
  const result = await db.query<PostRevision>(`
    INSERT INTO post_revisions (post_id, content, revised_by, revision_type)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [postId, content, revisedBy, type]);
  return result.rows[0];
}

export async function getRevisions(postId: number): Promise<PostRevision[]> {
  const db = await getDb();
  const result = await db.query<PostRevision>(`
    SELECT pr.*, tm.name as revised_by_name
    FROM post_revisions pr
    JOIN team_members tm ON pr.revised_by = tm.id
    WHERE pr.post_id = $1
    ORDER BY pr.created_at DESC
  `, [postId]);
  return result.rows;
}

export async function getStatusHistory(postId: number): Promise<PostStatusHistory[]> {
  const db = await getDb();
  const result = await db.query<PostStatusHistory>(`
    SELECT psh.*, tm.name as changed_by_name
    FROM post_status_history psh
    JOIN team_members tm ON psh.changed_by = tm.id
    WHERE psh.post_id = $1
    ORDER BY psh.created_at DESC
  `, [postId]);
  return result.rows;
}

export async function getPostsByWeek(weekStart: string): Promise<Post[]> {
  const db = await getDb();
  const result = await db.query<Post>(`
    SELECT p.*, tm.name as author_name, d.name as designer_name
    FROM posts p
    JOIN team_members tm ON p.author_id = tm.id
    LEFT JOIN team_members d ON p.assigned_designer_id = d.id
    WHERE p.scheduled_date >= $1::date AND p.scheduled_date < ($1::date + INTERVAL '7 days')
    ORDER BY p.scheduled_date ASC
  `, [weekStart]);
  return result.rows;
}

export async function getDashboardStats() {
  const db = await getDb();

  const totalPostsResult = await db.query<{ count: number }>("SELECT COUNT(*)::int as count FROM posts");
  const totalPosts = toNumber(totalPostsResult.rows[0]?.count);

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1);
  const weekStartStr = weekStart.toISOString().split("T")[0];
  const postsThisWeekResult = await db.query<{ count: number }>(
    "SELECT COUNT(*)::int as count FROM posts WHERE created_at >= $1",
    [weekStartStr]
  );
  const postsThisWeek = toNumber(postsThisWeekResult.rows[0]?.count);

  const inPipelineResult = await db.query<{ count: number }>(
    "SELECT COUNT(*)::int as count FROM posts WHERE status NOT IN ('draft', 'published')"
  );
  const inPipeline = toNumber(inPipelineResult.rows[0]?.count);

  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const publishedThisMonthResult = await db.query<{ count: number }>(
    "SELECT COUNT(*)::int as count FROM posts WHERE status = 'published' AND updated_at >= $1",
    [monthStart]
  );
  const publishedThisMonth = toNumber(publishedThisMonthResult.rows[0]?.count);

  const statusCountsResult = await db.query<{ status: string; count: number }>(
    "SELECT status, COUNT(*)::int as count FROM posts GROUP BY status"
  );

  const typeCountsResult = await db.query<{ post_type: string; count: number }>(
    "SELECT post_type, COUNT(*)::int as count FROM posts GROUP BY post_type"
  );

  const teamContributionsResult = await db.query<{ name: string; posts_created: number; posts_published: number }>(`
    SELECT tm.name,
      COUNT(p.id)::int as posts_created,
      COUNT(CASE WHEN p.status = 'published' THEN 1 END)::int as posts_published
    FROM team_members tm
    LEFT JOIN posts p ON p.author_id = tm.id
    GROUP BY tm.id
    ORDER BY posts_created DESC
  `);

  const recentActivityResult = await db.query<PostStatusHistory>(`
    SELECT psh.*, tm.name as changed_by_name
    FROM post_status_history psh
    JOIN team_members tm ON psh.changed_by = tm.id
    ORDER BY psh.created_at DESC
    LIMIT 10
  `);

  return {
    totalPosts,
    postsThisWeek,
    inPipeline,
    publishedThisMonth,
    postsByStatus: Object.fromEntries(statusCountsResult.rows.map((s) => [s.status, toNumber(s.count)])),
    postsByType: Object.fromEntries(typeCountsResult.rows.map((t) => [t.post_type, toNumber(t.count)])),
    teamContributions: teamContributionsResult.rows.map((item) => ({
      name: item.name,
      posts_created: toNumber(item.posts_created),
      posts_published: toNumber(item.posts_published),
    })),
    recentActivity: recentActivityResult.rows,
  };
}
