"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FolderOpen, File, Upload, Plus, Trash2,
  Download, ChevronRight, Loader2, FileText,
  Image as ImageIcon, Film, Music, Archive, FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { uploadDocument, createFolder, deleteDocument, deleteFolder, getSignedUrl } from "@/app/(app)/documents/actions";
import type { Document, DocumentFolder } from "@/types/database";

function fileIcon(mimeType: string | null) {
  if (!mimeType) return <File className="h-4 w-4 text-faint" />;
  if (mimeType.startsWith("image/")) return <ImageIcon className="h-4 w-4 text-accent" />;
  if (mimeType.startsWith("video/")) return <Film className="h-4 w-4 text-purple-400" />;
  if (mimeType.startsWith("audio/")) return <Music className="h-4 w-4 text-pink-400" />;
  if (mimeType.includes("pdf") || mimeType.includes("word") || mimeType.includes("text"))
    return <FileText className="h-4 w-4 text-blue-400" />;
  if (mimeType.includes("zip") || mimeType.includes("tar") || mimeType.includes("gzip"))
    return <Archive className="h-4 w-4 text-warning" />;
  if (mimeType.includes("javascript") || mimeType.includes("typescript") || mimeType.includes("json"))
    return <FileCode className="h-4 w-4 text-success" />;
  return <File className="h-4 w-4 text-faint" />;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentBrowser({
  allFolders,
  allDocuments,
  currentFolderId,
}: {
  allFolders: DocumentFolder[];
  allDocuments: Document[];
  currentFolderId?: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);

  const currentFolder = currentFolderId
    ? allFolders.find((f) => f.id === currentFolderId)
    : null;

  // Build breadcrumb path for the current folder
  const breadcrumb = useMemo(() => {
    const path: DocumentFolder[] = [];
    let node = currentFolder;
    while (node) {
      path.unshift(node);
      node = node.parent_id ? allFolders.find((f) => f.id === node!.parent_id) ?? null : null;
    }
    return path;
  }, [currentFolder, allFolders]);

  const childFolders = allFolders.filter(
    (f) => (currentFolderId ? f.parent_id === currentFolderId : f.parent_id === null)
  );

  const currentDocs = allDocuments.filter(
    (d) => (currentFolderId ? d.folder_id === currentFolderId : d.folder_id === null)
  );

  async function handleFiles(files: FileList) {
    if (!files.length) return;
    setUploading(true);
    setUploadError(null);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.set("file", file);
      if (currentFolderId) formData.set("folder_id", currentFolderId);
      const result = await uploadDocument(formData);
      if (result?.error) {
        setUploadError(result.error);
        break;
      }
    }

    setUploading(false);
    router.refresh();
  }

  async function handleCreateFolder(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("name", folderName);
    if (currentFolderId) formData.set("parent_id", currentFolderId);
    await createFolder(formData);
    setNewFolderOpen(false);
    setFolderName("");
    router.refresh();
  }

  async function handleDownload(doc: Document) {
    setDownloading(doc.id);
    const url = await getSignedUrl(doc.storage_path);
    setDownloading(null);
    if (url) {
      const a = window.document.createElement("a");
      a.href = url;
      a.download = doc.name;
      a.click();
    }
  }

  async function handleDeleteDoc(docId: string) {
    await deleteDocument(docId);
    router.refresh();
  }

  async function handleDeleteFolder(folderId: string) {
    await deleteFolder(folderId);
    router.refresh();
  }

  return (
    <div className="px-4 sm:px-8 py-6 max-w-5xl mx-auto space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Documents &amp; Files</h1>
          <p className="text-xs text-white/50 mt-0.5">
            {allDocuments.length} file{allDocuments.length === 1 ? "" : "s"} across active storage shards
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setNewFolderOpen(true)}>
            <Plus className="h-4 w-4" />
            New Folder
          </Button>
          <Button size="sm" onClick={() => fileInputRef.current?.click()} loading={uploading}>
            <Upload className="h-4 w-4" />
            Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>
      </div>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs font-mono text-white/50 flex-wrap">
        <Link href="/documents" className="text-white/60 hover:text-white transition-colors">
          root
        </Link>
        {breadcrumb.map((f) => (
          <span key={f.id} className="flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3 text-white/30" />
            <Link
              href={`/documents?folder=${f.id}`}
              className={cn(
                "transition-colors",
                f.id === currentFolderId ? "text-primary font-semibold" : "text-white/60 hover:text-white"
              )}
            >
              {f.name}
            </Link>
          </span>
        ))}
      </nav>

      {/* Drop zone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200",
          dragging
            ? "border-primary bg-primary/10 shadow-[0_0_20px_var(--primary-glow)] scale-[1.01]"
            : "border-white/10 bg-surface/40 hover:border-white/20"
        )}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
        }}
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-xs font-medium text-white/70">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Uploading file to secure storage shard...
          </div>
        ) : (
          <p className="text-xs text-white/60">
            Drop files here or{" "}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-primary hover:text-primary-hover font-semibold transition-colors"
            >
              browse from your computer
            </button>
          </p>
        )}
        {uploadError && (
          <p className="text-xs text-rose-400 mt-2 font-mono">{uploadError}</p>
        )}
      </div>

      {/* Folders */}
      {childFolders.length > 0 && (
        <div>
          <h2 className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-3">
            Folders
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {childFolders.map((folder) => (
              <div key={folder.id} className="group relative">
                <Link
                  href={`/documents?folder=${folder.id}`}
                  className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-surface/75 backdrop-blur-sm px-3.5 py-3 hover:border-white/20 transition-all shadow-sm group-hover:border-primary/40"
                >
                  <FolderOpen className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-xs font-bold text-white truncate">{folder.name}</span>
                </Link>
                <button
                  onClick={() => handleDeleteFolder(folder.id)}
                  aria-label={`Delete folder ${folder.name}`}
                  className="absolute top-2 right-2 h-5 w-5 flex items-center justify-center rounded-md text-white/40 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files */}
      <div>
        {childFolders.length > 0 && (
          <h2 className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-3">
            Files
          </h2>
        )}
        {currentDocs.length === 0 && childFolders.length === 0 ? (
          <div className="flex flex-col items-center text-center py-16 border border-white/[0.08] rounded-2xl bg-surface/50">
            <FolderOpen className="h-5 w-5 text-white/30 mb-2" />
            <p className="text-sm font-bold text-white">
              {currentFolderId ? "This folder is empty." : "No files yet."}
            </p>
            <p className="text-xs text-white/50 mt-1">Upload files or drag them into the drop zone above.</p>
          </div>
        ) : currentDocs.length === 0 ? null : (
          <>
            {/* Mobile Card List (< md) */}
            <div className="grid grid-cols-1 gap-2.5 md:hidden">
              {currentDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-xl border border-white/[0.08] bg-surface/75 backdrop-blur-sm flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    {fileIcon(doc.mime_type)}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{doc.name}</p>
                      <p className="text-[10px] font-mono text-white/40 mt-0.5">
                        {formatBytes(doc.size_bytes)} · {doc.uploader_name ?? "Member"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleDownload(doc)}
                      disabled={downloading === doc.id}
                      className="h-7 w-7 flex items-center justify-center rounded-md text-white/60 hover:text-white hover:bg-white/[0.06]"
                    >
                      {downloading === doc.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteDoc(doc.id)}
                      className="h-7 w-7 flex items-center justify-center rounded-md text-white/40 hover:text-rose-400 hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (≥ md) */}
            <div className="hidden md:block rounded-2xl border border-white/[0.08] bg-surface/75 backdrop-blur-sm overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02] text-white/50 uppercase font-mono tracking-wider">
                    <th className="px-5 py-3.5 font-semibold">Name</th>
                    <th className="px-5 py-3.5 font-semibold">Size</th>
                    <th className="px-5 py-3.5 font-semibold">Uploaded By</th>
                    <th className="px-5 py-3.5 font-semibold">Modified</th>
                    <th className="px-5 py-3.5 w-16" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {currentDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-white/[0.03] transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          {fileIcon(doc.mime_type)}
                          <span className="text-white font-semibold truncate max-w-xs">{doc.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-white/60 font-mono">{formatBytes(doc.size_bytes)}</td>
                      <td className="px-5 py-3.5 text-white/60 font-mono">{doc.uploader_name ?? "—"}</td>
                      <td className="px-5 py-3.5 text-white/40 font-mono">
                        {new Date(doc.updated_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={() => handleDownload(doc)}
                            disabled={downloading === doc.id}
                            className="h-7 w-7 flex items-center justify-center rounded-md text-white/60 hover:text-white hover:bg-white/[0.06]"
                            title="Download"
                          >
                            {downloading === doc.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Download className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteDoc(doc.id)}
                            className="h-7 w-7 flex items-center justify-center rounded-md text-white/40 hover:text-rose-400 hover:bg-rose-500/10"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* New folder modal */}
      <Modal open={newFolderOpen} onClose={() => setNewFolderOpen(false)} title="New Folder">
        <form onSubmit={handleCreateFolder} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1.5">
              Folder name
            </label>
            <Input
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Design Assets"
              required
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setNewFolderOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
