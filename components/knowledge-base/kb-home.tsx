"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, FolderOpen, Plus, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewCategoryButton } from "@/components/knowledge-base/new-category-button";
import { ArticleStatusBadge } from "@/components/knowledge-base/article-status-badge";
import type { KbArticle, KbCategory } from "@/types/database";

export function KbHome({
  categories,
  articles,
  initialCategoryFilter,
}: {
  categories: KbCategory[];
  articles: KbArticle[];
  initialCategoryFilter?: string;
}) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(initialCategoryFilter);

  const activeCategory = categoryFilter
    ? categories.find((c) => c.id === categoryFilter)
    : undefined;

  const filteredArticles = useMemo(() => {
    let list = articles;
    if (categoryFilter) {
      list = list.filter((a) => a.category_id === categoryFilter);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [articles, query, categoryFilter]);

  return (
    <div className="px-6 sm:px-8 py-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-white">Knowledge Base</h1>
          <p className="text-sm text-muted">
            {articles.length} article{articles.length === 1 ? "" : "s"} across {categories.length} categor{categories.length === 1 ? "y" : "ies"}
          </p>
        </div>
        <Link href="/knowledge-base/new">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            New Article
          </Button>
        </Link>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles, content, or tags..."
          className="w-full h-11 pl-10 pr-3 rounded-sm bg-surface border border-border text-sm text-white placeholder:text-faint focus:border-accent focus:ring-1 focus:ring-accent"
        />
      </div>

      {!query && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-faint uppercase tracking-wide">
              Categories
            </h2>
            <NewCategoryButton />
          </div>
          {categories.length === 0 ? (
            <div className="flex flex-col items-center text-center py-10 border border-border rounded-md bg-surface">
              <FolderOpen className="h-5 w-5 text-faint mb-2" />
              <p className="text-sm text-muted">No categories yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id === categoryFilter ? undefined : cat.id)}
                  className={`text-left rounded-md border p-4 transition-colors ${
                    cat.id === categoryFilter
                      ? "border-accent bg-accent/5"
                      : "border-border bg-surface hover:border-white/20"
                  }`}
                >
                  <FolderOpen className="h-4 w-4 text-accent mb-2" />
                  <p className="text-sm font-medium text-white">{cat.name}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {cat.article_count ?? 0} article{cat.article_count === 1 ? "" : "s"}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {activeCategory && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-muted">Filtering by</span>
          <span className="inline-flex items-center gap-1.5 text-xs bg-accent/10 text-accent border border-accent/20 rounded-full px-2.5 py-1">
            {activeCategory.name}
            <button onClick={() => setCategoryFilter(undefined)}>
              <X className="h-3 w-3" />
            </button>
          </span>
        </div>
      )}

      <div>
        <h2 className="text-xs font-semibold text-faint uppercase tracking-wide mb-3">
          {query ? "Search results" : activeCategory ? `Articles in ${activeCategory.name}` : "Recently updated"}
        </h2>
        {filteredArticles.length === 0 ? (
          <div className="flex flex-col items-center text-center py-16 border border-border rounded-md bg-surface">
            <FileText className="h-5 w-5 text-faint mb-2" />
            <p className="text-sm text-muted">
              {query ? "No articles match your search." : "No articles yet."}
            </p>
          </div>
        ) : (
          <div className="border border-border rounded-md bg-surface divide-y divide-border">
            {filteredArticles.map((article) => (
              <Link
                key={article.id}
                href={`/knowledge-base/${article.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{article.title}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {article.kb_categories?.name ?? "Uncategorized"} · Updated{" "}
                    {new Date(article.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <ArticleStatusBadge status={article.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
