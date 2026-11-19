import Link from "next/link";
import { asc, desc } from "drizzle-orm";
import { Plus, ArrowLeft, Pencil } from "lucide-react";
import { db } from "@/db";
import { accountProjects } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import DeleteAccountProjectButton from "@/components/DeleteAccountProjectButton";

// Same date+time format as app/(dashboard)/announcements/page.tsx's formatDate.
function formatDateTime(d: Date): string {
  return (
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
    ", " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  );
}

const SORT_OPTIONS = [
  { key: "newest", label: "Newest" },
  { key: "name_asc", label: "Client name A–Z" },
  { key: "name_desc", label: "Client name Z–A" },
] as const;
type SortKey = (typeof SORT_OPTIONS)[number]["key"];

export default async function AccountProjectsListPage({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  await requirePermission("accounts.view");

  const { sort } = await searchParams;
  const sortKey: SortKey = SORT_OPTIONS.some((o) => o.key === sort) ? (sort as SortKey) : "newest";

  // "Newest" stays the default (the project someone just created is the
  // one they're most likely looking for next) — the client-name sorts are
  // an explicit, link-driven choice, same query-param pattern already used
  // by Salary Slips' month filter.
  const orderBy =
    sortKey === "name_asc" ? asc(accountProjects.clientName) : sortKey === "name_desc" ? desc(accountProjects.clientName) : desc(accountProjects.createdAt);
  const rows = await db.select().from(accountProjects).orderBy(orderBy);

  return (
    <div>
      <Link href="/accounts" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--sec-blue)] hover:underline">
        <ArrowLeft size={14} />
        Back to Accounts
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--sec-ink)]">Account Projects</h1>
          <p className="mt-1 text-sm text-[var(--sec-muted)]">
            {rows.length} {rows.length === 1 ? "project" : "projects"}
          </p>
        </div>
        <Link
          href="/accounts/account-projects/new"
          className="flex items-center gap-2 rounded-md bg-[var(--sec-blue)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--sec-blue-deep)]"
        >
          <Plus size={16} />
          New project
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-[var(--sec-muted)]">Sort by</span>
        {SORT_OPTIONS.map((o) => (
          <Link
            key={o.key}
            href={o.key === "newest" ? "/accounts/account-projects" : `/accounts/account-projects?sort=${o.key}`}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              sortKey === o.key
                ? "border-[var(--sec-blue)] bg-blue-50 text-[var(--sec-blue)]"
                : "border-[var(--sec-line)] text-[var(--sec-muted)] hover:border-[var(--sec-blue)] hover:text-[var(--sec-blue)]"
            }`}
          >
            {o.label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-[var(--sec-line)] bg-white py-16 text-center">
          <p className="text-sm text-[var(--sec-muted)]">No account projects yet.</p>
          <Link href="/accounts/account-projects/new" className="mt-3 inline-block text-sm font-medium text-[var(--sec-blue)] hover:underline">
            Create the first one
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-[var(--sec-line)] bg-white">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--sec-line)] text-xs uppercase tracking-wide text-[var(--sec-muted)]">
                <th className="px-4 py-3 font-medium">S. No.</th>
                <th className="px-4 py-3 font-medium">Client name</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Project details</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p, index) => (
                <tr key={p.id} className="border-b border-[var(--sec-line)] last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 text-[var(--sec-muted)]">{index + 1}</td>
                  <td className="px-4 py-3">
                    <Link href={`/accounts/account-projects/${p.id}`} className="font-semibold text-[var(--sec-ink)] hover:underline">
                      {p.clientName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--sec-muted)]">{p.location || "—"}</td>
                  <td className="px-4 py-3 text-[var(--sec-muted)]">{p.projectDetails || "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-[var(--sec-muted)]">{formatDateTime(p.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/accounts/account-projects/${p.id}/edit`}
                        className="flex items-center gap-1.5 rounded-md border border-[var(--sec-line)] px-3 py-1.5 text-xs font-medium text-[var(--sec-muted)] transition-colors hover:border-[var(--sec-blue)] hover:bg-blue-50 hover:text-[var(--sec-blue)]"
                      >
                        <Pencil size={13} />
                        Edit
                      </Link>
                      <DeleteAccountProjectButton accountProjectId={p.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}