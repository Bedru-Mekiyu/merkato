"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function createWorkspace(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Workspace name is required." };

  const baseSlug = slugify(name) || "workspace";
  const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 6)}`;
  const supabase = await createClient();

  const { error } = await supabase.rpc("create_organization", {
    org_name: name,
    org_slug: slug,
  });

  if (error) return { error: error.message };
  redirect("/dashboard");
}
