import { desc } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import StatementProjectPicker from "@/components/StatementProjectPicker";

export default async function StatementOfAccountIndexPage() {
  await requirePermission("accounts.view");

  const rows = await db
    .select({
      id: projects.id,
      projectCode: projects.projectCode,
      municipalityNo: projects.municipalityNo,
      name: projects.name,
      clientName: projects.clientName,
    })
    .from(projects)
    .orderBy(desc(projects.createdAt));

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--sec-ink)]">Statement of Account</h1>
      <p className="mt-1 text-sm text-[var(--sec-muted)]">Pick a project to view its statement.</p>
      <div className="mt-6">
        <StatementProjectPicker
          projects={rows.map((p) => ({
            id: p.id,
            label: p.municipalityNo || p.projectCode,
            name: p.name,
            clientName: p.clientName,
          }))}
        />
      </div>
    </div>
  );
}
