import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { ArticleEditor } from "@/components/knowledge-base/article-editor";
import type { KbArticle, KbCategory } from "@/types/database";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireOrgContext();
  const supabase = await createClient();

  const [{ data: article }, { data: categories }] = await Promise.all([
    supabase
      .from("kb_articles")
      .select("*")
      .eq("id", id)
      .eq("organization_id", ctx.organization.id)
      .single(),
    supabase
      .from("kb_categories")
      .select("*")
      .eq("organization_id", ctx.organization.id)
      .order("name"),
  ]);

  if (!article) notFound();

  return (
    <ArticleEditor
      article={article as KbArticle}
      categories={(categories ?? []) as KbCategory[]}
    />
  );
}
