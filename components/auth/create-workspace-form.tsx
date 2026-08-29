"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createWorkspace } from "@/app/onboarding/actions";

export function CreateWorkspaceForm() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.set("name", name);
    const result = await createWorkspace(formData);

    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-white/70 uppercase tracking-wider mb-1.5">
          Workspace Name
        </label>
        <Input
          type="text"
          placeholder="Acme Corp"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
        {name.trim().length > 0 && (
          <p className="mt-1.5 text-xs text-white/40 font-mono">
            URL: merkato.app/<span className="text-indigo-400">{slug || "workspace"}</span>
          </p>
        )}
      </div>

      {error && (
        <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-md px-3 py-2.5">
          {error}
        </div>
      )}

      <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
        Launch Workspace
      </Button>
    </form>
  );
}
