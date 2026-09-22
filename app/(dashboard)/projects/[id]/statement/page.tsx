import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { Download } from "lucide-react";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { getStatementOfAccountData } from "@/lib/statement-data";
import StatementOfAccountPrintView from "@/components/StatementOfAccountPrintView";
import StatementStampToggle from "@/components/StatementStampToggle";
import PrintButton from "@/components/PrintButton";
import { toFilenameSafe } from "@/lib/pdf-filename";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [project] = await db.select({ projectCode: projects.projectCode }).from(projects).where(eq(projects.id, id)).limit(1);
  return { title: project ? `${toFilenameSafe(project.projectCode)}-Statement` : "Statement of Account" };
}

export default async function StatementOfAccountPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("accounts.view");

  const { id } = await params;
  const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!project) notFound();

  const data = await getStatementOfAccountData(id);
  if (!data) notFound();

  return (
    <div>
      <div className="no-print mb-6 flex items-center justify-between">
        <Link href={`/projects/${project.id}`} className="text-sm font-medium text-[var(--sec-blue)] hover:underline">
          ← Back to project
        </Link>
        <div className="flex items-center gap-3">
          <StatementStampToggle projectId={project.id} initialShowStamp={project.statementShowStamp} />
          <a
            href={`/api/statement-of-account/${id}/pdf`}
            className="flex items-center gap-1.5 rounded-md bg-[var(--sec-blue)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--sec-blue-deep)]"
          >
            <Download size={13} />
            Download PDF
          </a>
          <PrintButton />
        </div>
      </div>

      <StatementOfAccountPrintView data={data} />
    </div>
  );
}
