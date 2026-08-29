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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Authentication required." };
  }

  const { data: orgId, error } = await supabase.rpc("create_organization", {
    org_name: name,
    org_slug: slug,
  });

  if (error) return { error: error.message };

  // Seed default #general channel for instant team communication
  if (orgId) {
    try {
      const { data: generalChannel } = await supabase
        .from("channels")
        .insert({
          organization_id: orgId,
          name: "general",
          is_dm: false,
          created_by: user.id,
        })
        .select("id")
        .single();

      if (generalChannel) {
        await supabase.from("messages").insert({
          organization_id: orgId,
          channel_id: generalChannel.id,
          body: `👋 Welcome to ${name}! This is the #general channel for team-wide announcements and collaboration.`,
          created_by: user.id,
        });
      }

      await supabase.from("activity_log").insert({
        organization_id: orgId,
        type: "member_joined",
        actor_id: user.id,
        summary: `created the workspace "${name}"`,
      });
    } catch {
      // Non-blocking initialization
    }
  }

  redirect("/dashboard");
}
