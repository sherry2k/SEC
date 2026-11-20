"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, Pencil, Trash2, Loader2, Check, X, CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";

export type AnnouncementRowData = {
  id: string;
  title: string;
  body: string;
  postedByLabel: string;
  createdAtLabel: string;
  isUnread: boolean;
  isConfirmedByMe: boolean;
  confirmedCount: number;
  totalStaff: number;
};

export default function AnnouncementRow({
  announcement,
  canManage,
  roster,
}: {
  announcement: AnnouncementRowData;
  canManage: boolean;
  // Admin/Master Admin only — who exactly has and hasn't confirmed, by
  // name. Undefined for a regular staff member (they only see their own
  // confirm button, never anyone else's status).
  roster?: { name: string; confirmed: boolean }[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [title, setTitle] = useState(announcement.title);
  const [body, setBody] = useState(announcement.body);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [confirmed, setConfirmed] = useState(announcement.isConfirmedByMe);
  const [confirming, setConfirming] = useState(false);
  const [rosterOpen, setRosterOpen] = useState(false);

  const handleConfirm = async () => {
    setConfirming(true);
    setConfirmed(true); // optimistic — this is a one-way action, nothing to roll back to
    try {
      const res = await fetch(`/api/announcements/${announcement.id}/confirm`, { method: "POST" });
      if (!res.ok) {
        setConfirmed(false);
      } else {
        router.refresh();
      }
    } catch {
      setConfirmed(false);
    } finally {
      setConfirming(false);
    }
  };

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

          <div className="mt-3 flex flex-wrap items-center gap-3">
            {confirmed ? (
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 size={13} />
                Confirmed
              </span>
            ) : (
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="flex items-center gap-1.5 rounded-full border border-[var(--sec-blue)] px-3 py-1 text-xs font-semibold text-[var(--sec-blue)] transition-colors hover:bg-blue-50 disabled:opacity-60"
              >
                {confirming ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                Confirm you've read this
              </button>
            )}

            {canManage && roster && (
              <button
                onClick={() => setRosterOpen((v) => !v)}
                className="flex items-center gap-1 text-xs font-medium text-[var(--sec-muted)] hover:text-[var(--sec-blue)]"
              >
                {rosterOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                {announcement.confirmedCount} / {announcement.totalStaff} confirmed
              </button>
            )}
          </div>

          {canManage && roster && rosterOpen && (
            <div className="mt-2.5 flex flex-wrap gap-1.5 rounded-md border border-[var(--sec-line)] bg-slate-50 p-2.5">
              {roster.map((person) => (
                <span
                  key={person.name}
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                    person.confirmed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {person.confirmed ? <Check size={11} /> : <X size={11} />}
                  {person.name}
                </span>
              ))}
            </div>
          )}

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
