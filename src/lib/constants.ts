import { PostStatus, PostType, AuthRole } from "./types";

export const POST_TYPE_LABELS: Record<PostType, string> = {
  problem_solution: "Problem-Solution",
  educational: "Educational",
  execution: "Execution / Build",
  carousel: "Carousel",
};

export const POST_TYPE_DESCRIPTIONS: Record<PostType, string> = {
  problem_solution: "Name a problem your audience faces, agitate it, and present a solution",
  educational: "Teach a concept, framework, or methodology with actionable takeaways",
  execution: "Share what you're building right now — challenges, decisions, lessons",
  carousel: "Multi-slide visual content for high engagement",
};

export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  draft: "Draft",
  in_review: "In Review",
  ready_for_design: "Ready for Design",
  with_designer: "With Designer",
  ready_to_publish: "Ready to Publish",
  published: "Published",
};

export const POST_STATUS_COLORS: Record<PostStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  in_review: "bg-yellow-100 text-yellow-700",
  ready_for_design: "bg-blue-100 text-blue-700",
  with_designer: "bg-purple-100 text-purple-700",
  ready_to_publish: "bg-emerald-100 text-emerald-700",
  published: "bg-green-100 text-green-700",
};

export const VALID_TRANSITIONS: Record<PostStatus, PostStatus[]> = {
  draft: ["in_review"],
  in_review: ["draft", "ready_for_design"],
  ready_for_design: ["in_review", "with_designer"],
  with_designer: ["ready_for_design", "ready_to_publish"],
  ready_to_publish: ["with_designer", "published"],
  published: [],
};

// Which roles can perform each transition
export const TRANSITION_ROLES: Record<string, AuthRole[]> = {
  // Employee submits their draft for review
  "draft->in_review": ["employee", "admin", "superadmin"],
  // Reviewer sends back to draft (request changes)
  "in_review->draft": ["admin", "superadmin"],
  // Reviewer approves for design
  "in_review->ready_for_design": ["admin", "superadmin"],
  // Reviewer sends back to review
  "ready_for_design->in_review": ["admin", "superadmin"],
  // Designer picks up / reviewer assigns to designer
  "ready_for_design->with_designer": ["admin", "designer", "superadmin"],
  // Designer sends back (needs more review)
  "with_designer->ready_for_design": ["designer", "admin", "superadmin"],
  // Designer marks design complete
  "with_designer->ready_to_publish": ["designer", "superadmin"],
  // Reviewer sends back to designer
  "ready_to_publish->with_designer": ["admin", "superadmin"],
  // Reviewer publishes
  "ready_to_publish->published": ["admin", "superadmin"],
};

export const ALL_STATUSES: PostStatus[] = [
  "draft",
  "in_review",
  "ready_for_design",
  "with_designer",
  "ready_to_publish",
  "published",
];

export const ALL_POST_TYPES: PostType[] = [
  "problem_solution",
  "educational",
  "execution",
  "carousel",
];
