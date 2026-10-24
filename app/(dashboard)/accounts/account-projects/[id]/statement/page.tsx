import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { accountProjects } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { getAccountProjectStatementData } from "@/lib/account-project-statement";
import AccountProjectStatementView from "@/components/AccountProjectStatementView";
import PrintButton from "@/components/PrintButton";
import DownloadPdfButton from "@/components/DownloadPdfButton";
import { toFilenameSafe } from "@/lib/pdf-filename";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [accountProject] = await db
    .select({ clientName: accountProjects.clientName })
    .from(accountProjects)
    .where(eq(accountProjects.id, id))
    .limit(1);
  return { title: accountProject ? `${toFilenameSafe(accountProject.clientName)}-Statement` : "Statement of Account" };
}

export default async function AccountProjectStatementPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("accounts.view");

  const { id } = await params;
  const data = await getAccountProjectStatementData(id);
  if (!data) notFound();

  return (
    <div>
      <div className="no-print mb-6 flex items-center justify-between">
        <Link
          href={`/accounts/account-projects/${id}`}
          className="flex items-center gap-1 text-sm font-medium text-[var(--sec-blue)] hover:underline"
        >
          <ArrowLeft size={14} />
          Back to project
        </Link>
        <div className="flex items-center gap-3">
          <DownloadPdfButton href={`/api/account-projects/${id}/statement/pdf`} />
          <PrintButton />
        </div>
      </div>

      <AccountProjectStatementView data={data} />
    </div>
  );
}
