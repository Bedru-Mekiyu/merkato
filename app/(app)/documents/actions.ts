"use server";

import { createClient } from "@/lib/supabase/server";
import { requireStaffContext } from "@/lib/org-context";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";

const BUCKET = "documents";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function storagePath(orgId: string, docId: string, fileName: string) {
  return `${orgId}/${docId}/${fileName}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ---------------------------------------------------------------------------
// Folders
// ---------------------------------------------------------------------------
export async function createFolder(formData: FormData) {
  const ctx = await requireStaffContext();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const parent_id = String(formData.get("parent_id") ?? "").trim() || null;
  if (!name) return { error: "Folder name is required." };

  const { error } = await supabase.from("document_folders").insert({
    organization_id: ctx.organization.id,
    name,
    parent_id,
    created_by: ctx.userId,
  });

  if (error) return { error: error.message };
  revalidatePath("/documents");
  return { success: true };
}

export async function deleteFolder(folderId: string) {
  await requireStaffContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("document_folders")
    .delete()
    .eq("id", folderId);
  if (error) return { error: error.message };
  revalidatePath("/documents");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Upload a new document (or a new version of an existing one)
// ---------------------------------------------------------------------------
export async function uploadDocument(formData: FormData) {
  const ctx = await requireStaffContext();
  const supabase = await createClient();

  const file = formData.get("file") as File | null;
  const folder_id = String(formData.get("folder_id") ?? "").trim() || null;

  if (!file || file.size === 0) return { error: "No file provided." };
  if (file.size > 50 * 1024 * 1024) return { error: "File must be under 50 MB." };

  // Check if a document with this name already exists in the folder (new version)
  let existingQuery = supabase
    .from("documents")
    .select("id, name")
    .eq("organization_id", ctx.organization.id)
    .eq("name", file.name)
    .eq("status", "active");

  existingQuery = folder_id
    ? existingQuery.eq("folder_id", folder_id)
    : existingQuery.is("folder_id", null);

  const { data: existing, error: existingError } = await existingQuery.maybeSingle();
  if (existingError) return { error: existingError.message };

  if (existing) {
    return uploadNewVersion(ctx.organization.id, ctx.userId, existing.id, file, supabase);
  }

  // New document — insert metadata row first to get its id, then upload
  const { data: doc, error: docError } = await supabase
    .from("documents")
    .insert({
      organization_id: ctx.organization.id,
      folder_id,
      name: file.name,
      storage_path: "pending", // will be updated after upload
      mime_type: file.type || null,
      size_bytes: file.size,
      created_by: ctx.userId,
      updated_by: ctx.userId,
    })
    .select()
    .single();

  if (docError || !doc) return { error: docError?.message ?? "Could not create document record." };

  const path = storagePath(ctx.organization.id, doc.id, file.name);
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, { contentType: file.type || "application/octet-stream" });

  if (uploadError) {
    // Clean up the metadata row if storage upload failed
    await supabase.from("documents").delete().eq("id", doc.id);
    return { error: uploadError.message };
  }

  // Update the real storage path
  const { error: pathError } = await supabase
    .from("documents")
    .update({ storage_path: path })
    .eq("id", doc.id);

  if (pathError) {
    await supabase.storage.from(BUCKET).remove([path]);
    await supabase.from("documents").delete().eq("id", doc.id);
    return { error: pathError.message };
  }

  await logActivity({
    organizationId: ctx.organization.id,
    actorId: ctx.userId,
    type: "document_uploaded",
    summary: `uploaded "${file.name}" (${formatBytes(file.size)})`,
    link: "/documents",
  });

  revalidatePath("/documents");
  return { success: true };
}

async function uploadNewVersion(
  orgId: string,
  userId: string,
  docId: string,
  file: File,
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  // Get current version count
  const { count } = await supabase
    .from("document_versions")
    .select("id", { count: "exact", head: true })
    .eq("document_id", docId);

  const nextVersion = (count ?? 0) + 1;

  // Fetch the current storage path so we can archive it as v(n)
  const { data: current } = await supabase
    .from("documents")
    .select("storage_path, size_bytes")
    .eq("id", docId)
    .single();

  if (current?.storage_path && current.storage_path !== "pending") {
    // Archive the current version
    await supabase.from("document_versions").insert({
      document_id: docId,
      organization_id: orgId,
      version_number: nextVersion - 1 === 0 ? 1 : nextVersion - 1,
      storage_path: current.storage_path,
      size_bytes: current.size_bytes ?? 0,
      created_by: userId,
    });
  }

  const newPath = storagePath(orgId, docId, `v${nextVersion}_${file.name}`);
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(newPath, arrayBuffer, { contentType: file.type || "application/octet-stream" });

  if (uploadError) return { error: uploadError.message };

  await supabase
    .from("documents")
    .update({
      storage_path: newPath,
      size_bytes: file.size,
      mime_type: file.type || null,
      updated_by: userId,
    })
    .eq("id", docId);

  await logActivity({
    organizationId: orgId,
    actorId: userId,
    type: "document_uploaded",
    summary: `uploaded a new version of "${file.name}"`,
    link: "/documents",
  });

  revalidatePath("/documents");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Generate a short-lived signed URL for downloading a file
// ---------------------------------------------------------------------------
export async function getSignedUrl(storagePath: string): Promise<string | null> {
  const ctx = await requireStaffContext();
  const supabase = await createClient();
  const { data: document } = await supabase
    .from("documents")
    .select("storage_path, organization_id, status")
    .eq("organization_id", ctx.organization.id)
    .eq("storage_path", storagePath)
    .eq("status", "active")
    .maybeSingle();

  if (!document) return null;

  const { data } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 60 * 60); // 1 hour
  return data?.signedUrl ?? null;
}

// ---------------------------------------------------------------------------
// Delete (trash) a document
// ---------------------------------------------------------------------------
export async function deleteDocument(docId: string) {
  const ctx = await requireStaffContext();
  const supabase = await createClient();

  const { data: doc } = await supabase
    .from("documents")
    .select("name, storage_path")
    .eq("id", docId)
    .single();

  const { error } = await supabase
    .from("documents")
    .update({ status: "trashed" })
    .eq("id", docId);

  if (error) return { error: error.message };

  await logActivity({
    organizationId: ctx.organization.id,
    actorId: ctx.userId,
    type: "document_deleted",
    summary: `deleted "${doc?.name ?? "a document"}"`,
    link: "/documents",
  });

  revalidatePath("/documents");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Restore a version (copies archived version bytes back as the current file)
// ---------------------------------------------------------------------------
export async function restoreVersion(versionId: string, docId: string) {
  const ctx = await requireStaffContext();
  const supabase = await createClient();

  const { data: version } = await supabase
    .from("document_versions")
    .select("storage_path, size_bytes")
    .eq("id", versionId)
    .eq("document_id", docId)
    .eq("organization_id", ctx.organization.id)
    .single();

  if (!version) return { error: "Version not found." };

  // Download the archived version bytes
  const { data: fileData, error: downloadError } = await supabase.storage
    .from(BUCKET)
    .download(version.storage_path);

  if (downloadError || !fileData) return { error: "Could not download the archived version." };

  // Re-upload as the new current path
  const { data: doc } = await supabase
    .from("documents")
    .select("name")
    .eq("id", docId)
    .eq("organization_id", ctx.organization.id)
    .single();

  const newPath = storagePath(ctx.organization.id, docId, `restored_${Date.now()}_${doc?.name ?? "file"}`);
  const arrayBuffer = await fileData.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(newPath, arrayBuffer);

  if (uploadError) return { error: uploadError.message };

  await supabase
    .from("documents")
    .update({ storage_path: newPath, size_bytes: version.size_bytes, updated_by: ctx.userId })
    .eq("id", docId);

  revalidatePath("/documents");
  return { success: true };
}
