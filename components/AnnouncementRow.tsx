"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, Pencil, Trash2, Loader2, Check, X } from "lucide-react";

export type AnnouncementRowData = {
  id: string;
  title: string;
  body: string;
  postedByLabel: string;
  createdAtLabel: string;
  isUnread: boolean;
};

export default function AnnouncementRow({ announcement, canManage }: { announcement: AnnouncementRowData; canManage: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [title, setTitle] = useState(announcement.title);
  const [body, setBody] = useState(announcement.body);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const saveEdit = async () => {
    if (!title.trim() || !body.trim()) {
      setError("Title and message are both required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/announcements/${announcement.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        setError(data.error || "Couldn't save that.");
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/announcements/${announcement.id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Couldn't delete that.");
        setSaving(false);
        setConfirmingDelete(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Couldn't reach the server.");
      setSaving(false);
      setConfirmingDelete(false);
    }
  };

  if (editing) {
    return (
      <div className="rounded-lg border border-[var(--sec-blue)] bg-white p-5">
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-[var(--sec-line)] px-3 py-2 text-sm font-bold outline-none focus:border-[var(--sec-blue)]"
          />
          <textarea
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full resize-y rounded-md border border-[var(--sec-line)] px-3 py-2 text-sm leading-relaxed outline-none focus:border-[var(--sec-blue)]"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setEditing(false);
                setTitle(announcement.title);
                setBody(announcement.body);
                setError("");
              }}
              className="rounded-md border border-[var(--sec-line)] px-4 py-2 text-sm font-semibold text-[var(--sec-ink)] hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={saveEdit}
              disabled={saving}
              className="flex items-center gap-2 rounded-md bg-[var(--sec-blue)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--sec-blue-deep)] disabled:opacity-60"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--sec-line)] bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
          <Megaphone size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[15px] font-bold text-[var(--sec-ink)]">{announcement.title}</p>
            {announcement.isUnread && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">New</span>
            )}
          </div>
          <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-[var(--sec-ink)]">{announcement.body}</p>
          <p className="mt-2.5 text-xs text-[var(--sec-muted)]">
            Posted by {announcement.postedByLabel} · {announcement.createdAtLabel}
          </p>
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>

        {canManage && !confirmingDelete && (
          <div className="flex shrink-0 gap-1">
            <button
              onClick={() => setEditing(true)}
              aria-label="Edit announcement"
              className="rounded-md p-1.5 text-[var(--sec-muted)] hover:bg-slate-100 hover:text-[var(--sec-ink)]"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => setConfirmingDelete(true)}
              aria-label="Delete announcement"
              className="rounded-md p-1.5 text-[var(--sec-muted)] hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}

        {canManage && confirmingDelete && (
          <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
            <span className="text-xs text-[var(--sec-muted)]">Delete this?</span>
            <button
              onClick={confirmDelete}
              disabled={saving}
              aria-label="Confirm delete"
              className="rounded-md p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            </button>
            <button
              onClick={() => setConfirmingDelete(false)}
              aria-label="Cancel delete"
              className="rounded-md p-1.5 text-[var(--sec-muted)] hover:bg-slate-100"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
