"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteArticle } from "@/app/(app)/knowledge-base/actions";

export function DeleteArticleButton({ articleId }: { articleId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted">Delete this article?</span>
        <button
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            await deleteArticle(articleId);
          }}
          className="text-xs text-danger hover:underline disabled:opacity-50"
        >
          Yes, delete
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-muted hover:text-white"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-danger border border-border rounded-sm px-2.5 py-1.5 transition-colors"
    >
      <Trash2 className="h-3 w-3" />
      Delete
    </button>
  );
}
