/**
 * Shared types and helpers for the workspace search API (/api/search),
 * used by both the route handler and the command palette.
 */

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}

export interface SearchResultsGroup {
  type: string;
  label: string;
  items: SearchResultItem[];
}

export type SearchResponse = {
  groups: SearchResultsGroup[];
};

/** PostgREST filter values can't contain reserved characters — sanitize safely. */
export function sanitizeSearchQuery(q: string): string {
  return q.replace(/[,()%\\]/g, " ").replace(/\s+/g, " ").trim();
}
