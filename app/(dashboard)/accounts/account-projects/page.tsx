import Link from "next/link";
import { asc } from "drizzle-orm";
import { Plus, ArrowLeft, Pencil } from "lucide-react";
import { db } from "@/db";
import { accountProjects } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import DeleteAccountProjectButton from "@/components/DeleteAccountProjectButton";

export default async function AccountProjectsListPage() {
  await requirePermission("accounts.view");

  const rows = await db.select().from(accountProjects).orderBy(asc(accountProjects.createdAt));

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

      {rows.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-[var(--sec-line)] bg-white py-16 text-center">
          <p className="text-sm text-[var(--sec-muted)]">No account projects yet.</p>
          <Link href="/accounts/account-projects/new" className="mt-3 inline-block text-sm font-medium text-[var(--sec-blue)] hover:underline">
            Create the first one
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-[var(--sec-line)] bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--sec-line)] text-xs uppercase tracking-wide text-[var(--sec-muted)]">
                <th className="px-4 py-3 font-medium">S. No.</th>
                <th className="px-4 py-3 font-medium">Client name</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Project details</th>
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