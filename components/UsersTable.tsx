"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, X, Ban, RotateCcw } from "lucide-react";
import { ASSIGNABLE_ROLES, ROLE_LABELS, type Role, type UserStatus } from "@/lib/roles";

type UserRow = {
  id: number;
  name: string;
  username: string;
  role: Role;
  designation: string | null;
  status: UserStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
};

const STATUS_STYLES: Record<UserStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-slate-100 text-slate-600 border-slate-200",
  disabled: "bg-red-50 text-red-700 border-red-200",
};

function formatDate(d: Date | null) {
  if (!d) return "Never";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function UsersTable({ users, currentUserId }: { users: UserRow[]; currentUserId: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [designationDrafts, setDesignationDrafts] = useState<Record<number, string>>(
    Object.fromEntries(users.map((u) => [u.id, u.designation ?? ""]))
  );

  const patchUser = async (id: number, body: { role?: Role; status?: UserStatus; designation?: string }) => {
    setError("");
    setBusyId(id);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Couldn't update that user.");
        return;
      }
      startTransition(() => router.refresh());
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-[var(--sec-line)] bg-white">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--sec-line)] text-xs uppercase tracking-wide text-[var(--sec-muted)]">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Username</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Designation</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Last login</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.id === currentUserId;
              const isMasterAdmin = u.role === "master_admin";
              const locked = isSelf || isMasterAdmin;
              const rowBusy = busyId === u.id || (isPending && busyId === u.id);

              return (
                <tr key={u.id} className="border-b border-[var(--sec-line)] last:border-0">
                  <td className="px-4 py-3 font-medium text-[var(--sec-ink)]">
                    {u.name}
                    {isSelf && <span className="ml-2 text-xs font-normal text-[var(--sec-muted)]">(you)</span>}
                  </td>
                  <td className="px-4 py-3 text-[var(--sec-muted)]">@{u.username}</td>
                  <td className="px-4 py-3">
                    {isMasterAdmin ? (
                      <span className="text-[var(--sec-ink)]">{ROLE_LABELS[u.role]}</span>
                    ) : (
                      <select
                        value={u.role}
                        disabled={locked || rowBusy || u.status === "pending"}
                        onChange={(e) => patchUser(u.id, { role: e.target.value as Role })}
                        className="rounded-md border border-[var(--sec-line)] bg-white px-2 py-1.5 text-sm text-[var(--sec-ink)] outline-none focus:border-[var(--sec-blue)] disabled:opacity-50"
                      >
                        {ASSIGNABLE_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isMasterAdmin ? (
                      <span className="text-[var(--sec-muted)]">—</span>
                    ) : (
                      <input
                        value={designationDrafts[u.id] ?? ""}
                        onChange={(e) => setDesignationDrafts((prev) => ({ ...prev, [u.id]: e.target.value }))}
                        onBlur={(e) => {
                          if (e.target.value !== (u.designation ?? "")) patchUser(u.id, { designation: e.target.value });
                        }}
                        disabled={rowBusy}
                        placeholder="e.g. Architectural Engineer"
                        className="w-full rounded-md border border-[var(--sec-line)] bg-white px-2.5 py-1.5 text-sm text-[var(--sec-ink)] outline-none focus:border-[var(--sec-blue)] disabled:opacity-50"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[u.status]}`}
                    >
                      {u.status[0].toUpperCase() + u.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--sec-muted)]">{formatDate(u.lastLoginAt)}</td>
                  <td className="px-4 py-3">
                    {locked ? (
                      <span className="text-xs text-[var(--sec-muted)]">—</span>
                    ) : rowBusy ? (
                      <Loader2 size={16} className="animate-spin text-[var(--sec-muted)]" />
                    ) : u.status === "pending" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => patchUser(u.id, { status: "approved" })}
                          className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button
                          onClick={() => patchUser(u.id, { status: "rejected" })}
                          className="inline-flex items-center gap-1 rounded-md border border-[var(--sec-line)] px-2.5 py-1 text-xs font-medium text-[var(--sec-muted)] hover:bg-slate-50"
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    ) : u.status === "disabled" || u.status === "rejected" ? (
                      <button
                        onClick={() => patchUser(u.id, { status: "approved" })}
                        className="inline-flex items-center gap-1 rounded-md border border-[var(--sec-line)] px-2.5 py-1 text-xs font-medium text-[var(--sec-ink)] hover:bg-slate-50"
                      >
                        <RotateCcw size={14} /> Re-enable
                      </button>
                    ) : (
                      <button
                        onClick={() => patchUser(u.id, { status: "disabled" })}
                        className="inline-flex items-center gap-1 rounded-md border border-[var(--sec-line)] px-2.5 py-1 text-xs font-medium text-[var(--sec-muted)] hover:bg-red-50 hover:text-red-600"
                      >
                        <Ban size={14} /> Disable
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
