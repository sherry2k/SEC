import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { ArrowLeft, Plus, Pencil } from "lucide-react";
import { db } from "@/db";
import { clients, accountProjects } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { CATEGORY_LABELS, CATEGORY_BADGE_STYLES, type ProjectCategory } from "@/lib/checklist";
import DeleteClientButton from "@/components/DeleteClientButton";

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("accounts.view");
  const { id } = await params;

  const [client] = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  if (!client) notFound();

  const projects = await db.select().from(accountProjects).where(eq(accountProjects.clientId, id)).orderBy(desc(accountProjects.createdAt));

  return (
    <div>
      <Link href="/accounts/clients" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--sec-blue)] hover:underline">
        <ArrowLeft size={14} />
        Back to Clients
      </Link>

      {/* Client identity card — entered once, shared by every project below */}
      <div className="rounded-lg border border-[var(--sec-line)] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[var(--sec-ink)]">{client.name}</h1>
            <div className="mt-2 grid grid-cols-1 gap-x-7 gap-y-1 text-sm text-[var(--sec-muted)] sm:grid-cols-3">
              <div>
                <span className="text-xs text-slate-400">Address</span>
                <br />
                {client.address || "—"}
              </div>
              <div>
                <span className="text-xs text-slate-400">TRN</span>
                <br />
                {client.trn || "—"}
              </div>
              <div>
                <span className="text-xs text-slate-400">Contact</span>
                <br />
                {client.contactInfo || "—"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/accounts/clients/${id}/edit`}
              className="flex items-center gap-1.5 rounded-md border border-[var(--sec-line)] px-3 py-1.5 text-xs font-medium text-[var(--sec-muted)] transition-colors hover:border-[var(--sec-blue)] hover:bg-blue-50 hover:text-[var(--sec-blue)]"
            >
              <Pencil size={13} />
              Edit client
            </Link>
            <DeleteClientButton clientId={id} />
          </div>
        </div>
      </div>

      {/* Their projects */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[var(--sec-ink)]">Projects</h2>
          <p className="mt-0.5 text-sm text-[var(--sec-muted)]">
            Each project keeps its own quotations, invoices, and statement of account — completely separate.
          </p>
        </div>
        <Link
          href={`/accounts/account-projects/new?clientId=${id}`}
          className="flex items-center gap-2 rounded-md bg-[var(--sec-blue)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--sec-blue-deep)]"
        >
          <Plus size={16} />
          New project for this client
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-[var(--sec-line)] bg-white py-12 text-center">
          <p className="text-sm text-[var(--sec-muted)]">No projects for this client yet.</p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2.5">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/accounts/account-projects/${p.id}`}
              className="block rounded-lg border border-[var(--sec-line)] bg-white p-4 transition-colors hover:border-[var(--sec-blue)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--sec-ink)]">{p.projectDetails || p.clientName}</p>
                  <p className="mt-0.5 text-xs text-[var(--sec-muted)]">
                    {p.location || "No location set"} — created {formatDate(p.createdAt)}
                  </p>
                </div>
                {p.categories && p.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {p.categories.map((c) => (
                      <span
                        key={c}
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${CATEGORY_BADGE_STYLES[c as ProjectCategory] ?? "bg-slate-100 text-slate-600"}`}
                      >
                        {CATEGORY_LABELS[c as ProjectCategory] ?? c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <p className="mt-5 max-w-xl text-xs text-[var(--sec-muted)]">
        Nothing financial is merged across these — this page is only a shared contact card and a quick way to jump between a client&apos;s
        separate projects.
      </p>
    </div>
  );
}
