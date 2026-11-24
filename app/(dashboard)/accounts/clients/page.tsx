import Link from "next/link";
import { desc } from "drizzle-orm";
import { Plus, ArrowLeft, Pencil } from "lucide-react";
import { db } from "@/db";
import { clients, accountProjects } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import DeleteClientButton from "@/components/DeleteClientButton";

// Clients — the shared name/address/TRN/contact record a client's Account
// Projects link to, so it's entered once instead of retyped per project.
// Nothing financial lives here; each Account Project below still keeps its
// own fully separate quotations/invoices/statement of account.
export default async function ClientsListPage() {
  await requirePermission("accounts.view");

  const rows = await db.select().from(clients).orderBy(desc(clients.createdAt));
  const allProjects = await db.select({ id: accountProjects.id, clientId: accountProjects.clientId }).from(accountProjects);

  const projectCountByClient = new Map<string, number>();
  for (const p of allProjects) {
    if (!p.clientId) continue;
    projectCountByClient.set(p.clientId, (projectCountByClient.get(p.clientId) ?? 0) + 1);
  }

  return (
    <div>
      <Link href="/accounts" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--sec-blue)] hover:underline">
        <ArrowLeft size={14} />
        Back to Accounts
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--sec-ink)]">Clients</h1>
          <p className="mt-1 text-sm text-[var(--sec-muted)]">
            {rows.length} {rows.length === 1 ? "client" : "clients"} — each one holding every Account Project you run for them.
          </p>
        </div>
        <Link
          href="/accounts/clients/new"
          className="flex items-center gap-2 rounded-md bg-[var(--sec-blue)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--sec-blue-deep)]"
        >
          <Plus size={16} />
          New client
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-[var(--sec-line)] bg-white py-16 text-center">
          <p className="text-sm text-[var(--sec-muted)]">No clients yet.</p>
          <Link href="/accounts/clients/new" className="mt-3 inline-block text-sm font-medium text-[var(--sec-blue)] hover:underline">
            Add the first one
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-[var(--sec-line)] bg-white">
          <table className="w-full min-w-[840px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--sec-line)] text-xs uppercase tracking-wide text-[var(--sec-muted)]">
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">TRN</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Projects</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const count = projectCountByClient.get(c.id) ?? 0;
                return (
                  <tr key={c.id} className="border-b border-[var(--sec-line)] last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/accounts/clients/${c.id}`} className="font-semibold text-[var(--sec-ink)] hover:underline">
                        {c.name}
                      </Link>
                      {c.address && <div className="mt-0.5 text-xs text-[var(--sec-muted)]">{c.address}</div>}
                    </td>
                    <td className="px-4 py-3 text-[var(--sec-muted)]">{c.trn || "—"}</td>
                    <td className="px-4 py-3 text-[var(--sec-muted)]">{c.contactInfo || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[var(--sec-blue)]">
                        {count} {count === 1 ? "project" : "projects"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/accounts/clients/${c.id}/edit`}
                          className="flex items-center gap-1.5 rounded-md border border-[var(--sec-line)] px-3 py-1.5 text-xs font-medium text-[var(--sec-muted)] transition-colors hover:border-[var(--sec-blue)] hover:bg-blue-50 hover:text-[var(--sec-blue)]"
                        >
                          <Pencil size={13} />
                          Edit
                        </Link>
                        <DeleteClientButton clientId={c.id} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
