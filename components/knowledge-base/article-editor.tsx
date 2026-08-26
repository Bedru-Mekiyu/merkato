"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createArticle, updateArticle } from "@/app/(app)/knowledge-base/actions";
import type { ArticleStatus, KbArticle, KbCategory } from "@/types/database";

export function ArticleEditor({
  article,
  categories,
}: {
  article?: KbArticle;
  categories: KbCategory[];
}) {
  const router = useRouter();
  const isEditing = Boolean(article);

  const [title, setTitle] = useState(article?.title ?? "");
  const [content, setContent] = useState(article?.content ?? "");
  const [categoryId, setCategoryId] = useState(article?.category_id ?? "");
  const [tags, setTags] = useState((article?.tags ?? []).join(", "));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(status: ArticleStatus) {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("title", title);
    formData.set("content", content);
    formData.set("category_id", categoryId);
    formData.set("tags", tags);
    formData.set("status", status);

    const result: { error: string } | { success: true; article?: KbArticle } =
      isEditing
        ? await updateArticle(article!.id, formData)
        : await createArticle(formData);

    setLoading(false);

    if (!result || "error" in result) {
      setError(
        result && "error" in result ? result.error : "Something went wrong."
      );
      return;
    }

    const targetId = isEditing ? article!.id : result.article?.id ?? "";
    router.push(`/knowledge-base/${targetId}`);
    router.refresh();
  }

  return (
    <div className="px-6 sm:px-8 py-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-white">
          {isEditing ? "Edit Article" : "New Article"}
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            loading={loading}
            onClick={() => handleSave("draft")}
          >
            Save Draft
          </Button>
          <Button size="sm" loading={loading} onClick={() => handleSave("published")}>
            Publish
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Article title"
          className="text-base h-12 font-medium"
          autoFocus
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-10 px-3 rounded-sm bg-surface border border-border text-sm text-white focus:border-accent focus:ring-1 focus:ring-accent"
            >
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">
              Tags (comma-separated)
            </label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="onboarding, setup"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted mb-1.5">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={18}
            placeholder="Write your article in Markdown..."
            className="w-full px-4 py-3 rounded-sm bg-surface border border-border text-sm text-white placeholder:text-faint focus:border-accent focus:ring-1 focus:ring-accent resize-none font-mono leading-relaxed"
          />
          <p className="text-xs text-faint mt-1.5">
            Markdown is supported — headings, bold, lists, and code blocks will render in the reader view.
          </p>
        </div>

        {error && (
          <div className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-sm px-3 py-2">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
