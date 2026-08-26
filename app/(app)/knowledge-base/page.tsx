import { requireOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { KbHome } from "@/components/knowledge-base/kb-home";
import type { KbArticle, KbCategory } from "@/types/database";

export default async function KnowledgeBasePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: categoryFilter } = await searchParams;
  const ctx = await requireOrgContext();
  const supabase = await createClient();

  const [{ data: categories }, { data: articles }] = await Promise.all([
    supabase
      .from("kb_categories")
      .select("*, kb_articles(id)")
      .eq("organization_id", ctx.organization.id)
      .order("name"),
    supabase
      .from("kb_articles")
      .select("*, kb_categories(name)")
      .eq("organization_id", ctx.organization.id)
      .order("updated_at", { ascending: false }),
  ]);

  const categoriesWithCounts: KbCategory[] = (categories ?? []).map((c) => ({
    ...c,
    kb_articles: undefined,
    article_count: ((c.kb_articles as { id: string }[]) ?? []).length,
  })) as KbCategory[];

  return (
    <KbHome
      categories={categoriesWithCounts}
      articles={(articles ?? []) as KbArticle[]}
      initialCategoryFilter={categoryFilter}
    />
  );
}
