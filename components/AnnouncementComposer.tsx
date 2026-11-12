"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, Plus, X } from "lucide-react";

export default function AnnouncementComposer({ posterLabel }: { posterLabel: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!body.trim()) {
      setError("Message is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        setError(data.error || "Couldn't post that.");
        return;
      }
      setTitle("");
      setBody("");
      setOpen(false);
      router.refresh();
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md bg-[var(--sec-blue)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--sec-blue-deep)]"
      >
        <Plus size={16} />
        New Announcement
      </button>
    );
  }

  return (
    <div className="mb-6 rounded-lg border border-[var(--sec-line)] bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-bold text-[var(--sec-ink)]">New Announcement</p>
        <button
          onClick={() => setOpen(false)}
          aria-label="Cancel"
          className="rounded-md p-1 text-[var(--sec-muted)] hover:bg-slate-100 hover:text-[var(--sec-ink)]"
        >
          <X size={16} />
        </button>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--sec-muted)]">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Lunch Break Policy Update"
            className="w-full rounded-md border border-[var(--sec-line)] px-3 py-2 text-sm outline-none focus:border-[var(--sec-blue)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--sec-muted)]">Message</label>
          <textarea
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write the announcement here. Staff will see this in full when they open it."
            className="w-full resize-y rounded-md border border-[var(--sec-line)] px-3 py-2 text-sm leading-relaxed outline-none focus:border-[var(--sec-blue)]"
          />
        </div>
        <p className="text-xs text-[var(--sec-muted)]">
          Posted as {posterLabel} — goes out to every user, there's no audience to pick.
        </p>
        <div className="mt-1 flex justify-end gap-2">
          <button
            onClick={() => setOpen(false)}
            className="rounded-md border border-[var(--sec-line)] px-4 py-2 text-sm font-semibold text-[var(--sec-ink)] hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="flex items-center gap-2 rounded-md bg-[var(--sec-blue)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--sec-blue-deep)] disabled:opacity-60"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            Post Announcement
          </button>
        </div>
      </div>
    </div>
  );
}
