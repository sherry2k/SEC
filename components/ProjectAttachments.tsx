"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, Upload, Loader2, Trash2, Check, X, FileText, Image as ImageIcon, File as FileIcon } from "lucide-react";

export type Attachment = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSizeBytes: number;
  uploadedByName: string | null;
  uploadedAt: string;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function FileTypeIcon({ fileName }: { fileName: string }) {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png"].includes(ext)) return <ImageIcon size={16} className="text-[var(--sec-muted)]" />;
  if (ext === "pdf") return <FileText size={16} className="text-[var(--sec-muted)]" />;
  return <FileIcon size={16} className="text-[var(--sec-muted)]" />;
}

export default function ProjectAttachments({
  projectId,
  initialAttachments,
  canEdit,
}: {
  projectId: string;
  initialAttachments: Attachment[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [attachments, setAttachments] = useState(initialAttachments);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [justUploaded, setJustUploaded] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    setJustUploaded("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/projects/${projectId}/attachments`, { method: "POST", body: formData });
      const data: {
        error?: string;
        uploaderName?: string;
        attachment?: { id: string; fileName: string; fileUrl: string; fileSizeBytes: number; uploadedAt: string };
      } = await res.json().catch(() => ({}));
      if (!res.ok || !data.attachment) {
        setError(data.error || "Couldn't upload that file.");
        return;
      }
      // Add it straight into the visible list — router.refresh() alone
      // doesn't do this, since this component already mounted with its
      // own copy of the list and won't re-read a prop that changes later.
      setAttachments((prev) => [
        {
          id: data.attachment!.id,
          fileName: data.attachment!.fileName,
          fileUrl: data.attachment!.fileUrl,
          fileSizeBytes: data.attachment!.fileSizeBytes,
          uploadedByName: data.uploaderName ?? null,
          uploadedAt: data.attachment!.uploadedAt,
        },
        ...prev,
      ]);
      setJustUploaded(data.attachment.fileName);
      router.refresh();
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/projects/${projectId}/attachments/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAttachments((prev) => prev.filter((a) => a.id !== id));
        router.refresh();
      }
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  };

  return (
    <div className="no-print mt-8 rounded-lg border border-[var(--sec-line)] bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-bold text-lg text-[var(--sec-ink)]">
          <Paperclip size={17} />
          Attachments
        </h2>
        {canEdit && (
          <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-[var(--sec-line)] px-3 py-1.5 text-sm font-medium text-[var(--sec-ink)] transition-colors hover:border-[var(--sec-blue)]">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? "Uploading…" : "Upload drawing"}
            <input
              ref={inputRef}
              type="file"
              accept=".dwg,.dxf,.pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
          </label>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {justUploaded && !error && (
        <p className="mt-2 flex items-center gap-1 text-xs text-emerald-600">
          <Check size={12} />
          {justUploaded} uploaded
        </p>
      )}

      {attachments.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--sec-muted)]">No drawings or files attached yet.</p>
      ) : (
        <div className="mt-3 divide-y divide-[var(--sec-line)]">
          {attachments.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-3 py-2.5">
              <a
                href={`/api/projects/${projectId}/attachments/${a.id}/download`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 items-center gap-2.5 hover:underline"
              >
                <FileTypeIcon fileName={a.fileName} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--sec-blue)]">{a.fileName}</p>
                  <p className="text-xs text-[var(--sec-muted)]">
                    {formatSize(a.fileSizeBytes)} · {a.uploadedByName ?? "Someone"} · {formatDate(a.uploadedAt)}
                  </p>
                </div>
              </a>

              {canEdit &&
                (confirmingId === a.id ? (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => handleDelete(a.id)}
                      disabled={deletingId === a.id}
                      className="rounded-md p-1.5 text-red-600 hover:bg-red-50"
                      aria-label="Confirm delete"
                    >
                      {deletingId === a.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    </button>
                    <button
                      onClick={() => setConfirmingId(null)}
                      className="rounded-md p-1.5 text-[var(--sec-muted)] hover:bg-slate-100"
                      aria-label="Cancel"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmingId(a.id)}
                    className="shrink-0 rounded-md p-1.5 text-[var(--sec-muted)] hover:bg-red-50 hover:text-red-600"
                    aria-label={`Delete ${a.fileName}`}
                  >
                    <Trash2 size={14} />
                  </button>
                ))}
            </div>
          ))}
        </div>
      )}
      <p className="mt-3 text-xs text-[var(--sec-muted)]">DWG, DXF, PDF, JPG, PNG — up to 50MB per file.</p>
    </div>
  );
}
