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
    <div className="px-4 sm:px-8 py-6 max-w-5xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Knowledge Base</h1>
          <p className="text-xs text-white/50 mt-0.5">
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

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles, technical docs, runbooks, or tags..."
          className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface/85 border border-white/[0.08] text-sm text-white placeholder:text-white/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
        />
      </div>

      {!query && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[11px] font-bold text-white/50 uppercase tracking-wider">
              Categories
            </h2>
            <NewCategoryButton />
          </div>
          {categories.length === 0 ? (
            <div className="flex flex-col items-center text-center py-10 border border-white/[0.08] rounded-xl bg-surface/40">
              <FolderOpen className="h-5 w-5 text-white/30 mb-2" />
              <p className="text-sm text-white/60">No categories yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id === categoryFilter ? undefined : cat.id)}
                  className={`text-left rounded-xl border p-4 transition-all duration-150 active:scale-[0.98] ${
                    cat.id === categoryFilter
                      ? "border-primary/40 bg-primary/10 shadow-[0_0_12px_var(--primary-glow)]"
                      : "border-white/[0.08] bg-surface/75 backdrop-blur-sm hover:border-white/20"
                  }`}
                >
                  <FolderOpen className="h-4 w-4 text-primary mb-2" />
                  <p className="text-sm font-bold text-white">{cat.name}</p>
                  <p className="text-xs font-mono text-white/50 mt-0.5">
                    {cat.article_count ?? 0} article{cat.article_count === 1 ? "" : "s"}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {activeCategory && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/50">Filtering by</span>
          <span className="inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary border border-primary/25 rounded-full px-3 py-1 font-semibold">
            {activeCategory.name}
            <button onClick={() => setCategoryFilter(undefined)} className="hover:opacity-75">
              <X className="h-3 w-3" />
            </button>
          </span>
        </div>
      )}

      <div>
        <h2 className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-3">
          {query ? "Search results" : activeCategory ? `Articles in ${activeCategory.name}` : "Recently updated"}
        </h2>
        {filteredArticles.length === 0 ? (
          <div className="flex flex-col items-center text-center py-16 border border-white/[0.08] rounded-2xl bg-surface/50">
            <FileText className="h-5 w-5 text-white/30 mb-2" />
            <p className="text-sm text-white/60">
              {query ? "No articles match your search." : "No articles yet."}
            </p>
          </div>
        ) : (
          <div className="border border-white/[0.08] rounded-2xl bg-surface/75 backdrop-blur-sm divide-y divide-white/[0.06] overflow-hidden shadow-sm">
            {filteredArticles.map((article) => (
              <Link
                key={article.id}
                href={`/knowledge-base/${article.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.03] transition-colors group"
              >
                <div className="min-w-0 pr-4">
                  <p className="text-sm font-semibold text-white group-hover:text-primary transition-colors truncate">
                    {article.title}
                  </p>
                  <p className="text-xs text-white/45 mt-0.5 font-mono">
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
