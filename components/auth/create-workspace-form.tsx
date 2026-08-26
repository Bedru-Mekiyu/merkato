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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-white/80 mb-1.5">
          Workspace name
        </label>
        <Input
          type="text"
          placeholder="Acme Inc."
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
      </div>

      {error && (
        <div className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-sm px-3 py-2">
          {error}
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full">
        Create workspace
      </Button>
    </form>
  );
}
