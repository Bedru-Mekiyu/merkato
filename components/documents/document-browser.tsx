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
    <div className="px-6 sm:px-8 py-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold text-white">Documents</h1>
          <p className="text-sm text-muted">
            {allDocuments.length} file{allDocuments.length === 1 ? "" : "s"} in your workspace
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
      <nav className="flex items-center gap-1 text-sm mb-5 flex-wrap">
        <Link href="/documents" className="text-muted hover:text-white transition-colors">
          Documents
        </Link>
        {breadcrumb.map((f) => (
          <span key={f.id} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-faint" />
            <Link
              href={`/documents?folder=${f.id}`}
              className={cn(
                "transition-colors",
                f.id === currentFolderId ? "text-white font-medium" : "text-muted hover:text-white"
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
          "border-2 border-dashed rounded-md p-6 text-center mb-6 transition-colors",
          dragging ? "border-accent bg-accent/5" : "border-border"
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
          <div className="flex items-center justify-center gap-2 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading...
          </div>
        ) : (
          <p className="text-sm text-muted">
            Drop files here or{" "}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-accent hover:text-accent-hover"
            >
              click to upload
            </button>
          </p>
        )}
        {uploadError && (
          <p className="text-sm text-danger mt-2">{uploadError}</p>
        )}
      </div>

      {/* Folders */}
      {childFolders.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-faint uppercase tracking-wide mb-3">
            Folders
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {childFolders.map((folder) => (
              <div key={folder.id} className="group relative">
                <Link
                  href={`/documents?folder=${folder.id}`}
                  className="flex items-center gap-2.5 rounded-md border border-border bg-surface px-3 py-3 hover:border-white/20 transition-colors"
                >
                  <FolderOpen className="h-4 w-4 text-accent shrink-0" />
                  <span className="text-sm font-medium text-white truncate">{folder.name}</span>
                </Link>
                <button
                  onClick={() => handleDeleteFolder(folder.id)}
                  className="absolute top-1.5 right-1.5 h-5 w-5 flex items-center justify-center rounded text-faint hover:text-danger opacity-0 group-hover:opacity-100 transition-all"
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
          <h2 className="text-xs font-semibold text-faint uppercase tracking-wide mb-3">
            Files
          </h2>
        )}
        {currentDocs.length === 0 && childFolders.length === 0 ? (
          <div className="flex flex-col items-center text-center py-16 border border-border rounded-md bg-surface">
            <FolderOpen className="h-5 w-5 text-faint mb-2" />
            <p className="text-sm text-muted">
              {currentFolderId ? "This folder is empty." : "No files yet."}
            </p>
            <p className="text-xs text-faint mt-1">Upload files or drag them here.</p>
          </div>
        ) : currentDocs.length === 0 ? null : (
          <div className="border border-border rounded-md bg-surface overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-2.5 text-xs font-medium text-muted">Name</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-muted">Size</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-muted">Uploaded by</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-muted">Modified</th>
                  <th className="px-4 py-2.5 w-16" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {currentDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-white/[0.02] group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {fileIcon(doc.mime_type)}
                        <span className="text-white font-medium truncate max-w-xs">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{formatBytes(doc.size_bytes)}</td>
                    <td className="px-4 py-3 text-muted">{doc.uploader_name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted">
                      {new Date(doc.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => handleDownload(doc)}
                          disabled={downloading === doc.id}
                          className="h-7 w-7 flex items-center justify-center rounded-sm text-faint hover:text-white hover:bg-white/5"
                          title="Download"
                        >
                          {downloading === doc.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Download className="h-3.5 w-3.5" />
                          }
                        </button>
                        <button
                          onClick={() => handleDeleteDoc(doc.id)}
                          className="h-7 w-7 flex items-center justify-center rounded-sm text-faint hover:text-danger hover:bg-danger/10"
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
        )}
      </div>

      {/* New folder modal */}
      <Modal open={newFolderOpen} onClose={() => setNewFolderOpen(false)} title="New Folder">
        <form onSubmit={handleCreateFolder} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1.5">
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
