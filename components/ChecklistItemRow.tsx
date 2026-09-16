"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquarePlus, Pencil, Trash2, Check, X } from "lucide-react";
import { ITEM_STATUSES, ITEM_STATUS_LABELS, ITEM_STATUS_STYLES, type ItemStatus } from "@/lib/checklist";
import { classifyTask, URGENCY_STYLES } from "@/lib/task-urgency";

export type ChecklistComment = {
  id: string;
  comment: string;
  authorName: string | null;
  createdAt: string;
};

export type ChecklistItem = {
  id: string;
  name: string;
  status: ItemStatus;
  parentItemId: string | null;
  dueDate: string | null; // "YYYY-MM-DD" or null
  submittedByName: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  comments: ChecklistComment[];
  isCustom: boolean; // no templateId — added by staff for this project only
};

function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ChecklistItemRow({
  item,
  projectId,
  depth,
  canEdit,
  currentUserName,
}: {
  item: ChecklistItem;
  projectId: string;
  depth: number;
  canEdit: boolean;
  currentUserName: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(item.name);
  const [status, setStatus] = useState(item.status);
  const [dueDate, setDueDate] = useState(item.dueDate);
  const [submittedByName, setSubmittedByName] = useState(item.submittedByName);
  const [submittedAt, setSubmittedAt] = useState(item.submittedAt);
  const [approvedAt, setApprovedAt] = useState(item.approvedAt);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [comments, setComments] = useState(item.comments);
  const [confirmingCommentId, setConfirmingCommentId] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [addingComment, setAddingComment] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentSaving, setCommentSaving] = useState(false);

  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(item.name);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const save = async (patch: { status?: ItemStatus; dueDate?: string | null; name?: string }) => {
    const previous = { status, dueDate, name, submittedByName, submittedAt, approvedAt };

    if (patch.status !== undefined) {
      setStatus(patch.status);
      // Mirror the server's rules here too, so the credit line updates the
      // moment you change status, not just after the next page load.
      // Submitting is the staff action worth crediting; approval is the
      // municipality's call, so it only ever gets a date, never a name.
      if (patch.status === "submitted") {
        setSubmittedByName(currentUserName);
        setSubmittedAt(new Date().toISOString());
      }
      if (patch.status === "approved") {
        setApprovedAt(new Date().toISOString());
      } else if (previous.status === "approved") {
        setApprovedAt(null);
      }
    }
    if (patch.dueDate !== undefined) setDueDate(patch.dueDate);
    if (patch.name !== undefined) setName(patch.name);

    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/checklist/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        setStatus(previous.status);
        setDueDate(previous.dueDate);
        setName(previous.name);
        setSubmittedByName(previous.submittedByName);
        setSubmittedAt(previous.submittedAt);
        setApprovedAt(previous.approvedAt);
        setError(data.error || "Couldn't save that.");
        return false;
      }
      return true;
    } catch {
      setStatus(previous.status);
      setDueDate(previous.dueDate);
      setName(previous.name);
      setSubmittedByName(previous.submittedByName);
      setSubmittedAt(previous.submittedAt);
      setApprovedAt(previous.approvedAt);
      setError("Couldn't reach the server.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveRename = async () => {
    if (!nameDraft.trim()) return;
    const ok = await save({ name: nameDraft.trim() });
    if (ok) setRenaming(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/checklist/${item.id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        const data: { error?: string } = await res.json().catch(() => ({}));
        setError(data.error || "Couldn't delete that item.");
        setDeleting(false);
        setConfirmingDelete(false);
      }
    } catch {
      setError("Couldn't reach the server.");
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  const saveComment = async () => {
    if (!newComment.trim()) return;
    setCommentSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/checklist/${item.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: newComment.trim() }),
      });
      if (res.ok) {
        const data: { comment: { id: string; comment: string; createdAt: string } } = await res.json();
        setComments((prev) => [
          ...prev,
          { id: data.comment.id, comment: data.comment.comment, authorName: currentUserName, createdAt: data.comment.createdAt },
        ]);
        setNewComment("");
        setAddingComment(false);
        router.refresh();
      }
    } finally {
      setCommentSaving(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    setDeletingCommentId(commentId);
    try {
      const res = await fetch(`/api/projects/${projectId}/checklist/${item.id}/comments/${commentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        router.refresh();
      }
    } finally {
      setDeletingCommentId(null);
      setConfirmingCommentId(null);
    }
  };

  const urgency = classifyTask(dueDate, status);

  let creditLine: string | null = null;
  if (status === "approved" && approvedAt) {
    creditLine = submittedByName
      ? `Submitted by ${submittedByName}${submittedAt ? ` · ${formatDate(submittedAt)}` : ""} — Approved ${formatDate(approvedAt)}`
      : `Approved ${formatDate(approvedAt)}`;
  } else if (submittedByName && submittedAt) {
    creditLine = `Submitted by ${submittedByName} · ${formatDate(submittedAt)}`;
  }

  return (
    <div className="border-b border-[var(--sec-line)] py-2.5 last:border-0" style={{ paddingLeft: depth * 20 }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={depth > 0 ? "text-[var(--sec-muted)]" : "text-[var(--sec-ink)]"}>
          {renaming ? (
            <span className="no-print flex items-center gap-1.5">
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                autoFocus
                className="rounded-md border border-[var(--sec-line)] px-2 py-1 text-sm outline-none focus:border-[var(--sec-blue)]"
              />
              <button onClick={saveRename} disabled={saving} aria-label="Save name" className="rounded-md p-1 text-emerald-600 hover:bg-emerald-50">
                <Check size={14} />
              </button>
              <button
                onClick={() => {
                  setRenaming(false);
                  setNameDraft(name);
                }}
                aria-label="Cancel rename"
                className="rounded-md p-1 text-[var(--sec-muted)] hover:bg-slate-100"
              >
                <X size={14} />
              </button>
            </span>
          ) : (
            <span className="flex items-center gap-2 text-sm">
              {depth > 0 && <span className="text-[var(--sec-line)]">└</span>}
              {urgency && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${URGENCY_STYLES[urgency]}`} aria-hidden="true" />}
              {name}
              {item.isCustom && canEdit && (
                <span className="no-print flex items-center gap-1">
                  <button
                    onClick={() => setRenaming(true)}
                    aria-label={`Rename ${name}`}
                    className="rounded p-0.5 text-[var(--sec-muted)] hover:bg-slate-100 hover:text-[var(--sec-ink)]"
                  >
                    <Pencil size={12} />
                  </button>
                  {confirmingDelete ? (
                    <>
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="rounded p-0.5 text-red-600 hover:bg-red-50"
                        aria-label="Confirm delete"
                      >
                        {deleting ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                      </button>
                      <button
                        onClick={() => setConfirmingDelete(false)}
                        className="rounded p-0.5 text-[var(--sec-muted)] hover:bg-slate-100"
                        aria-label="Cancel delete"
                      >
                        <X size={12} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmingDelete(true)}
                      aria-label={`Delete ${name}`}
                      className="rounded p-0.5 text-[var(--sec-muted)] hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </span>
              )}
            </span>
          )}
          {creditLine && <span className="mt-0.5 block text-xs text-emerald-700">{creditLine}</span>}
        </span>

        <div className="flex items-center gap-2">
          {saving && <Loader2 size={14} className="animate-spin text-[var(--sec-muted)]" />}
          {error && <span className="text-xs text-red-600">{error}</span>}

          {/* Interactive controls: screen only, and only when editable */}
          {canEdit && (
            <div className="no-print flex items-center gap-2">
              <span className="text-xs text-[var(--sec-muted)]">Due</span>
              <input
                type="date"
                value={toDateInputValue(dueDate)}
                onChange={(e) => save({ dueDate: e.target.value || null })}
                disabled={saving}
                aria-label={`Due date for ${name}`}
                className="rounded-md border border-[var(--sec-line)] px-2 py-1 text-xs text-[var(--sec-ink)] outline-none focus:border-[var(--sec-blue)] disabled:opacity-60"
              />
              <select
                value={status}
                onChange={(e) => save({ status: e.target.value as ItemStatus })}
                disabled={saving}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium outline-none disabled:opacity-60 ${ITEM_STATUS_STYLES[status]}`}
              >
                {ITEM_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {ITEM_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Plain-text version: shown on screen when not editable, and
              always shown when printing (form controls above are hidden
              from print via .no-print) */}
          <div className={canEdit ? "hidden items-center gap-2 print:flex" : "flex items-center gap-2"}>
            {dueDate && <span className="text-xs text-[var(--sec-muted)]">Due {toDateInputValue(dueDate)}</span>}
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${ITEM_STATUS_STYLES[status]}`}>
              {ITEM_STATUS_LABELS[status]}
            </span>
          </div>
        </div>
      </div>

      {/* Comment thread — every entry is dated and kept, not one box that
          gets overwritten each time new feedback comes in. */}
      {comments.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start justify-between gap-2 rounded-md bg-slate-50 px-2.5 py-1.5 text-xs">
              <div>
                <p className="text-[var(--sec-ink)]">{c.comment}</p>
                <p className="mt-0.5 text-[var(--sec-muted)]">
                  {c.authorName ?? "Someone"} · {formatDate(c.createdAt)}
                </p>
              </div>
              {canEdit &&
                (confirmingCommentId === c.id ? (
                  <div className="no-print flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => deleteComment(c.id)}
                      disabled={deletingCommentId === c.id}
                      className="rounded p-0.5 text-red-600 hover:bg-red-100"
                      aria-label="Confirm delete comment"
                    >
                      {deletingCommentId === c.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    </button>
                    <button
                      onClick={() => setConfirmingCommentId(null)}
                      className="rounded p-0.5 text-[var(--sec-muted)] hover:bg-slate-200"
                      aria-label="Cancel delete comment"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmingCommentId(c.id)}
                    className="no-print shrink-0 rounded p-0.5 text-[var(--sec-muted)] hover:bg-red-100 hover:text-red-600"
                    aria-label="Delete comment"
                  >
                    <Trash2 size={12} />
                  </button>
                ))}
            </div>
          ))}
        </div>
      )}

      {canEdit &&
        (addingComment ? (
          <div className="no-print mt-2 flex flex-wrap items-center gap-2">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Comment — e.g. feedback received from the authority"
              autoFocus
              disabled={commentSaving}
              className="min-w-[220px] flex-1 rounded-md border border-[var(--sec-line)] px-2.5 py-1.5 text-xs text-[var(--sec-ink)] outline-none focus:border-[var(--sec-blue)]"
            />
            <button
              onClick={saveComment}
              disabled={commentSaving}
              className="rounded-md bg-[var(--sec-blue)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--sec-blue-deep)] disabled:opacity-50"
            >
              {commentSaving ? <Loader2 size={12} className="animate-spin" /> : "Save"}
            </button>
            <button
              onClick={() => {
                setAddingComment(false);
                setNewComment("");
              }}
              className="text-xs font-medium text-[var(--sec-muted)] hover:text-[var(--sec-ink)]"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAddingComment(true)}
            className="no-print mt-1.5 flex items-center gap-1 text-xs font-medium text-[var(--sec-blue)] hover:underline"
          >
            <MessageSquarePlus size={12} />
            Add comment
          </button>
        ))}
    </div>
  );
}
