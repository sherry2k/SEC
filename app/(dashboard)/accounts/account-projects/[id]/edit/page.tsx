import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { accountProjects } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import AccountProjectForm from "@/components/AccountProjectForm";

export default async function EditAccountProjectPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("accounts.edit");
  const { id } = await params;

  const [accountProject] = await db.select().from(accountProjects).where(eq(accountProjects.id, id)).limit(1);
  if (!accountProject) notFound();

  return (
    <div>
      <Link href={`/accounts/account-projects/${id}`} className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--sec-blue)] hover:underline">
        <ArrowLeft size={14} />
        Back to project
      </Link>
      <h1 className="text-2xl font-bold text-[var(--sec-ink)]">Edit account project</h1>
      <div className="mt-8 max-w-xl">
        <AccountProjectForm
          mode="edit"
          accountProjectId={accountProject.id}
          initial={{
            clientName: accountProject.clientName,
            location: accountProject.location ?? "",
            projectDetails: accountProject.projectDetails ?? "",
          }}
        />
      </div>
    </div>
  );
}