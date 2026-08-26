import { requireStaffContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { loadMemberNames } from "@/lib/team-data";
import { DocumentBrowser } from "@/components/documents/document-browser";
import type { Document, DocumentFolder } from "@/types/database";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string }>;
}) {
  const { folder: currentFolderId } = await searchParams;
  const ctx = await requireStaffContext();
  const supabase = await createClient();

  const [{ data: folders }, { data: documents }, memberNames] = await Promise.all([
    supabase
      .from("document_folders")
      .select("*")
      .eq("organization_id", ctx.organization.id)
      .order("name"),
    supabase
      .from("documents")
      .select("*")
      .eq("organization_id", ctx.organization.id)
      .eq("status", "active")
      .order("updated_at", { ascending: false }),
    loadMemberNames(ctx.organization.id),
  ]);

  const docsWithNames: Document[] = (documents ?? []).map((d) => ({
    ...d,
    uploader_name: d.updated_by ? memberNames[d.updated_by] ?? null : null,
  })) as Document[];

  return (
    <DocumentBrowser
      allFolders={(folders ?? []) as DocumentFolder[]}
      allDocuments={docsWithNames}
      currentFolderId={currentFolderId}
    />
  );
}
