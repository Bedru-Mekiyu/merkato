import { requireOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { ArticleEditor } from "@/components/knowledge-base/article-editor";
import type { KbCategory } from "@/types/database";

export default async function NewArticlePage() {
  const ctx = await requireOrgContext();
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("kb_categories")
    .select("*")
    .eq("organization_id", ctx.organization.id)
    .order("name");

  return <ArticleEditor categories={(categories ?? []) as KbCategory[]} />;
}
