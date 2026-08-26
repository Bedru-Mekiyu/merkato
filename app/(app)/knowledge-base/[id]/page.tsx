import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { requireOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { loadMemberNames } from "@/lib/team-data";
import { renderMarkdown } from "@/lib/markdown";
import { ArticleStatusBadge } from "@/components/knowledge-base/article-status-badge";
import { DeleteArticleButton } from "@/components/knowledge-base/delete-article-button";

export default async function ArticleReaderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireOrgContext();
  const supabase = await createClient();

  const { data: article } = await supabase
    .from("kb_articles")
    .select("*, kb_categories(name)")
    .eq("id", id)
    .eq("organization_id", ctx.organization.id)
    .single();

  if (!article) notFound();

  const { data: related } = article.category_id
    ? await supabase
        .from("kb_articles")
        .select("id, title")
        .eq("organization_id", ctx.organization.id)
        .eq("category_id", article.category_id)
        .neq("id", id)
        .limit(4)
    : { data: [] as { id: string; title: string }[] };

  const memberNames = await loadMemberNames(ctx.organization.id);
  const authorName = article.updated_by ? memberNames[article.updated_by] ?? "Someone" : "Someone";

  const html = renderMarkdown(article.content || "*This article has no content yet.*");

  return (
    <div className="px-6 sm:px-8 py-6">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/knowledge-base"
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-white mb-5 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Knowledge Base
        </Link>

        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="text-2xl font-bold text-white leading-tight">{article.title}</h1>
          <ArticleStatusBadge status={article.status} />
        </div>

        <div className="flex items-center gap-3 text-xs text-muted mb-6">
          <span>{article.kb_categories?.name ?? "Uncategorized"}</span>
          <span>·</span>
          <span>Updated by {authorName} on {new Date(article.updated_at).toLocaleDateString()}</span>
        </div>

        {article.tags.length > 0 && (
          <div className="flex items-center gap-1.5 mb-6 flex-wrap">
            {article.tags.map((tag: string) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/60 border border-border"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mb-8">
          <Link
            href={`/knowledge-base/${id}/edit`}
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-white border border-border rounded-sm px-2.5 py-1.5 transition-colors"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </Link>
          <DeleteArticleButton articleId={id} />
        </div>

        <article
          className="kb-article-content max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {related && related.length > 0 && (
          <div className="mt-10 pt-6 border-t border-border">
            <h3 className="text-xs font-semibold text-faint uppercase tracking-wide mb-3">
              Related Articles
            </h3>
            <div className="space-y-1.5">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/knowledge-base/${r.id}`}
                  className="block text-sm text-accent hover:text-accent-hover"
                >
                  {r.title}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
