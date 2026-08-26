export type OrgRole = "owner" | "admin" | "member" | "customer";

export type DealStage =
  | "new_lead"
  | "contacted"
  | "qualified"
  | "proposal"
  | "won"
  | "lost";

export const DEAL_STAGES: { value: DealStage; label: string }[] = [
  { value: "new_lead", label: "New Lead" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal", label: "Proposal" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrgRole;
  created_at: string;
}

export interface Company {
  id: string;
  organization_id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  organization_id: string;
  company_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // joined data (optional, populated by some queries)
  crm_companies?: { name: string } | null;
}

export interface Deal {
  id: string;
  organization_id: string;
  company_id: string | null;
  contact_id: string | null;
  title: string;
  value: number;
  stage: DealStage;
  owner_id: string | null;
  expected_close_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // joined data
  crm_companies?: { name: string } | null;
  crm_contacts?: { full_name: string } | null;
}

export interface Note {
  id: string;
  organization_id: string;
  contact_id: string | null;
  company_id: string | null;
  deal_id: string | null;
  body: string;
  created_by: string | null;
  created_at: string;
}

// ============================================================================
// Projects module
// ============================================================================

export type ProjectStatus = "active" | "on_hold" | "completed" | "archived";

export const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

export type TaskStatus = "todo" | "in_progress" | "review" | "done";

export const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
];

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export const TASK_PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "default" },
  { value: "medium", label: "Medium", color: "accent" },
  { value: "high", label: "High", color: "warning" },
  { value: "urgent", label: "Urgent", color: "danger" },
];

export interface Project {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  due_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // populated by some queries (aggregate counts)
  task_count?: number;
  done_count?: number;
}

export interface ProjectTask {
  id: string;
  organization_id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  assignee_id: string | null;
  position: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // joined data
  task_subtasks?: TaskSubtask[];
  assignee_name?: string | null;
}

export interface TaskSubtask {
  id: string;
  task_id: string;
  organization_id: string;
  title: string;
  is_done: boolean;
  position: number;
  created_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  organization_id: string;
  body: string;
  created_by: string | null;
  created_at: string;
  author_name?: string | null;
}

// ============================================================================
// Team Collaboration module
// ============================================================================

export interface Channel {
  id: string;
  organization_id: string;
  name: string | null;
  is_dm: boolean;
  created_by: string | null;
  created_at: string;
  // populated by some queries
  other_member_name?: string | null;
  last_message_at?: string | null;
}

export interface ChannelMember {
  id: string;
  channel_id: string;
  organization_id: string;
  user_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  organization_id: string;
  channel_id: string;
  body: string;
  created_by: string | null;
  created_at: string;
  author_name?: string | null;
}

export type ActivityType =
  | "deal_created"
  | "deal_stage_changed"
  | "deal_won"
  | "deal_lost"
  | "contact_created"
  | "company_created"
  | "project_created"
  | "task_created"
  | "task_completed"
  | "task_status_changed"
  | "comment_added"
  | "message_sent"
  | "ticket_created"
  | "ticket_resolved"
  | "ticket_assigned"
  | "document_uploaded"
  | "document_deleted"
  | "article_published"
  | "member_joined";

export interface ActivityLogEntry {
  id: string;
  organization_id: string;
  type: ActivityType;
  actor_id: string | null;
  summary: string;
  link: string | null;
  created_at: string;
  actor_name?: string | null;
}

// ============================================================================
// Knowledge Base module
// ============================================================================

export type ArticleStatus = "draft" | "published";

export interface KbCategory {
  id: string;
  organization_id: string;
  name: string;
  created_by: string | null;
  created_at: string;
  article_count?: number;
}

export interface KbArticle {
  id: string;
  organization_id: string;
  category_id: string | null;
  title: string;
  content: string;
  tags: string[];
  status: ArticleStatus;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  // joined data
  kb_categories?: { name: string } | null;
  author_name?: string | null;
}

// ============================================================================
// Customer Support module
// ============================================================================

export type TicketStatus = "open" | "pending" | "resolved" | "closed";

export const TICKET_STATUSES: { value: TicketStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "pending", label: "Pending" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export type TicketPriority = "low" | "medium" | "high" | "urgent";

export const TICKET_PRIORITIES: { value: TicketPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export interface SupportTicket {
  id: string;
  organization_id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string | null;
  customer_id: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  // joined / computed
  customer_name?: string | null;
  assignee_name?: string | null;
  message_count?: number;
}

export interface TicketMessage {
  id: string;
  organization_id: string;
  ticket_id: string;
  body: string;
  is_internal_note: boolean;
  created_by: string | null;
  created_at: string;
  author_name?: string | null;
}

// ============================================================================
// Document Management module
// ============================================================================

export interface DocumentFolder {
  id: string;
  organization_id: string;
  name: string;
  parent_id: string | null;
  created_by: string | null;
  created_at: string;
  child_count?: number;
}

export interface Document {
  id: string;
  organization_id: string;
  folder_id: string | null;
  name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number;
  status: "active" | "trashed";
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  uploader_name?: string | null;
  signed_url?: string | null;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  organization_id: string;
  version_number: number;
  storage_path: string;
  size_bytes: number;
  created_by: string | null;
  created_at: string;
  uploader_name?: string | null;
}
