"use server";

import { createClient } from "@/lib/supabase/server";
import { requireOrgContext } from "@/lib/org-context";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ArticleStatus, KbArticle } from "@/types/database";

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
export async function createCategory(formData: FormData) {
  const ctx = await requireOrgContext();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Category name is required." };

  const { error } = await supabase.from("kb_categories").insert({
    organization_id: ctx.organization.id,
    name,
    created_by: ctx.userId,
  });

  if (error) return { error: error.message };

  revalidatePath("/knowledge-base");
  return { success: true };
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("kb_categories").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/knowledge-base");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------
function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function createArticle(
  formData: FormData
): Promise<{ error: string } | { success: true; article: KbArticle }> {
  const ctx = await requireOrgContext();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "");
  const category_id = String(formData.get("category_id") ?? "").trim() || null;
  const tags = parseTags(String(formData.get("tags") ?? ""));
  const status = (String(formData.get("status") ?? "draft")) as ArticleStatus;

  if (!title) return { error: "Article title is required." };

  const { data, error } = await supabase
    .from("kb_articles")
    .insert({
      organization_id: ctx.organization.id,
      title,
      content,
      category_id,
      tags,
      status,
      created_by: ctx.userId,
      updated_by: ctx.userId,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  if (status === "published") {
    await logActivity({
      organizationId: ctx.organization.id,
      actorId: ctx.userId,
      type: "article_published",
      summary: `published the article "${title}"`,
      link: `/knowledge-base/${data.id}`,
    });
  }

  revalidatePath("/knowledge-base");
  return { success: true, article: data as KbArticle };
}

export async function updateArticle(
  articleId: string,
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  const ctx = await requireOrgContext();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "");
  const category_id = String(formData.get("category_id") ?? "").trim() || null;
  const tags = parseTags(String(formData.get("tags") ?? ""));
  const status = (String(formData.get("status") ?? "draft")) as ArticleStatus;

  if (!title) return { error: "Article title is required." };

  const { data: previous } = await supabase
    .from("kb_articles")
    .select("status")
    .eq("id", articleId)
    .single();

  const { error } = await supabase
    .from("kb_articles")
    .update({ title, content, category_id, tags, status, updated_by: ctx.userId })
    .eq("id", articleId);

  if (error) return { error: error.message };

  if (status === "published" && previous?.status !== "published") {
    await logActivity({
      organizationId: ctx.organization.id,
      actorId: ctx.userId,
      type: "article_published",
      summary: `published the article "${title}"`,
      link: `/knowledge-base/${articleId}`,
    });
  }

  revalidatePath("/knowledge-base");
  revalidatePath(`/knowledge-base/${articleId}`);
  return { success: true };
}

export async function deleteArticle(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("kb_articles").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/knowledge-base");
  redirect("/knowledge-base");
}
