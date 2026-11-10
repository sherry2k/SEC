"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, X, Pencil, Eye, EyeOff, Copy, Search, ExternalLink, Lock } from "lucide-react";
import type { PortalCredentialRow } from "@/lib/portal-credentials";
import { PORTAL_CREDENTIAL_CATEGORIES, CATEGORY_BADGE_COLORS } from "@/lib/portal-credentials-constants";

const inputClass =
  "w-full rounded-md border border-[var(--sec-line)] bg-white px-2.5 py-1.5 text-sm text-[var(--sec-ink)] outline-none focus:border-[var(--sec-blue)]";

function tryCopy(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
  }
}

type FormState = { name: string; category: string; url: string; username: string; password: string; notes: string };

function emptyForm(): FormState {
  return { name: "", category: PORTAL_CREDENTIAL_CATEGORIES[0], url: "", username: "", password: "", notes: "" };
}

function CredentialForm({
  initial,
  submitLabel,
  passwordOptional,
  onCancel,
  onSubmit,
}: {
  initial: FormState;
  submitLabel: string;
  passwordOptional: boolean;
  onCancel: () => void;
  onSubmit: (form: FormState) => Promise<string | null>;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async () => {
    if (!form.name.trim()) {
      setError("Portal name is required.");
      return;
    }
    if (!passwordOptional && !form.password) {
      setError("Password is required.");
      return;
    }
    setSaving(true);
    setError("");
    const err = await onSubmit(form);
    setSaving(false);
    if (err) setError(err);
  };

  return (
    <div className="rounded-lg border border-[var(--sec-line)] bg-slate-50 p-4">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <input value={form.name} onChange={set("name")} placeholder="Portal name (e.g. Tawtheeq / TAMM)" className={`${inputClass} sm:col-span-2`} />
        <select value={form.category} onChange={set("category")} className={inputClass}>
          {PORTAL_CREDENTIAL_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input value={form.url} onChange={set("url")} placeholder="Website (e.g. tamm.abudhabi.ae)" className={inputClass} />
        <input value={form.username} onChange={set("username")} placeholder="Username" className={inputClass} />
        <input
          value={form.password}
          onChange={set("password")}
          placeholder={passwordOptional ? "New password (leave blank to keep current)" : "Password"}
          className={inputClass}
        />
        <textarea
          value={form.notes}
          onChange={set("notes")}
          placeholder="Notes (optional)"
          rows={2}
          className={`${inputClass} sm:col-span-2 resize-none`}
        />
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <div className="mt-3 flex items-center justify-end gap-2">
        <button onClick={onCancel} className="rounded-md px-3 py-1.5 text-xs font-medium text-[var(--sec-muted)] hover:bg-slate-200">
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-md bg-[var(--sec-blue)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--sec-blue-deep)] disabled:opacity-50"
        >
          {saving && <Loader2 size={13} className="animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

function CredentialCard({ cred }: { cred: PortalCredentialRow }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const badge = CATEGORY_BADGE_COLORS[cred.category] ?? CATEGORY_BADGE_COLORS.Other;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/portal-credentials/${cred.id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  };

  if (editing) {
    return (
      <CredentialForm
        initial={{ name: cred.name, category: cred.category, url: cred.url, username: cred.username, password: "", notes: cred.notes }}
        submitLabel="Save changes"
        passwordOptional
        onCancel={() => setEditing(false)}
        onSubmit={async (form) => {
          const res = await fetch(`/api/portal-credentials/${cred.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          });
          if (!res.ok) {
            const data: { error?: string } = await res.json().catch(() => ({}));
            return data.error || "Couldn't save that change.";
          }
          router.refresh();
          setEditing(false);
          return null;
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3.5 rounded-xl border border-[var(--sec-line)] bg-white p-4.5 transition-colors hover:border-slate-300">
      <div className="flex items-center justify-between gap-2">
        <span
          className="rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide"
          style={{ background: badge.bg, color: badge.text }}
        >
          {cred.category}
        </span>
        <div className="flex items-center gap-0.5">
          <button onClick={() => setEditing(true)} aria-label={`Edit ${cred.name}`} className="rounded-md p-1.5 text-[var(--sec-muted)] hover:bg-slate-100 hover:text-[var(--sec-blue)]">
            <Pencil size={14} />
          </button>
          {confirming ? (
            <div className="flex items-center gap-1">
              <button onClick={handleDelete} disabled={deleting} aria-label="Confirm delete" className="rounded-md p-1.5 text-red-600 hover:bg-red-50">
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
              <button onClick={() => setConfirming(false)} aria-label="Cancel" className="rounded-md p-1.5 text-[var(--sec-muted)] hover:bg-slate-100">
                <X size={14} />
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirming(true)} aria-label={`Delete ${cred.name}`} className="rounded-md p-1.5 text-[var(--sec-muted)] hover:bg-red-50 hover:text-red-600">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <div>
        <p className="text-base font-bold text-[var(--sec-ink)]">{cred.name}</p>
        {cred.url && (
          <a
            href={/^https?:\/\//.test(cred.url) ? cred.url : `https://${cred.url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 inline-flex items-center gap-1 text-xs text-[var(--sec-blue)] hover:underline"
          >
            <ExternalLink size={12} />
            {cred.url}
          </a>
        )}
      </div>

      <div className="h-px bg-[var(--sec-line)]" />

      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--sec-muted)]">Username</p>
          <p className="truncate font-mono text-[13px] text-[var(--sec-ink)]">{cred.username || "—"}</p>
        </div>
        {cred.username && (
          <button onClick={() => tryCopy(cred.username)} aria-label={`Copy username for ${cred.name}`} className="shrink-0 rounded-md p-1.5 text-[var(--sec-muted)] hover:bg-slate-100">
            <Copy size={13} />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--sec-muted)]">Password</p>
          <p className="truncate font-mono text-[13px] text-[var(--sec-ink)]">{revealed ? cred.password : "•".repeat(Math.max(8, cred.password.length))}</p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            onClick={() => setRevealed((r) => !r)}
            aria-label={`${revealed ? "Hide" : "Show"} password for ${cred.name}`}
            className="rounded-md p-1.5 text-[var(--sec-muted)] hover:bg-slate-100"
          >
            {revealed ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
          <button onClick={() => tryCopy(cred.password)} aria-label={`Copy password for ${cred.name}`} className="rounded-md p-1.5 text-[var(--sec-muted)] hover:bg-slate-100">
            <Copy size={13} />
          </button>
        </div>
      </div>

      {cred.notes && <p className="text-xs text-[var(--sec-muted)]">{cred.notes}</p>}

      <p className="text-[11px] text-[var(--sec-muted)]">
        Updated {cred.updatedAtLabel}
        {cred.updatedByName && ` by ${cred.updatedByName}`}
      </p>
    </div>
  );
}

export default function PortalCredentialsClient({ credentials }: { credentials: PortalCredentialRow[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return credentials.filter((c) => {
      const matchesCategory = filter === "All" || c.category === filter;
      const matchesSearch = !needle || c.name.toLowerCase().includes(needle) || c.url.toLowerCase().includes(needle);
      return matchesCategory && matchesSearch;
    });
  }, [credentials, filter, search]);

  const categories = ["All", ...PORTAL_CREDENTIAL_CATEGORIES];

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const active = c === filter;
            const badge = c === "All" ? null : CATEGORY_BADGE_COLORS[c];
            return (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className="rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors"
                style={
                  active
                    ? badge
                      ? { background: badge.bg, color: badge.text }
                      : { background: "var(--sec-ink)", color: "#fff" }
                    : { background: "#fff", color: "var(--sec-muted)", border: "1px solid var(--sec-line)" }
                }
              >
                {c}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sec-muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search portals…"
              className={`${inputClass} pl-9`}
            />
          </div>
          <button
            onClick={() => setAdding((a) => !a)}
            className="flex items-center gap-1.5 rounded-md bg-[var(--sec-blue)] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[var(--sec-blue-deep)]"
          >
            <Plus size={15} />
            Add Credential
          </button>
        </div>
      </div>

      {adding && (
        <div className="mt-4">
          <CredentialForm
            initial={emptyForm()}
            submitLabel="Save credential"
            passwordOptional={false}
            onCancel={() => setAdding(false)}
            onSubmit={async (form) => {
              const res = await fetch("/api/portal-credentials", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
              });
              if (!res.ok) {
                const data: { error?: string } = await res.json().catch(() => ({}));
                return data.error || "Couldn't save that credential.";
              }
              router.refresh();
              setAdding(false);
              return null;
            }}
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-2 text-[var(--sec-muted)]">
          {credentials.length === 0 ? <Lock size={28} /> : <Search size={28} />}
          <p className="text-sm">{credentials.length === 0 ? "No portal credentials saved yet." : "No portals match your search."}</p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((cred) => (
            <CredentialCard key={cred.id} cred={cred} />
          ))}
        </div>
      )}
    </div>
  );
}
