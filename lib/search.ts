/**
 * Shared types for the workspace search API (/api/search), used by both
 * the route handler and the command palette.
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
