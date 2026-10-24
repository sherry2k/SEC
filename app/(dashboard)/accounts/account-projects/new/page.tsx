import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import AccountProjectForm from "@/components/AccountProjectForm";

export default async function NewAccountProjectPage() {
  await requirePermission("accounts.edit");

  return (
    <div>
      <Link href="/accounts/account-projects" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--sec-blue)] hover:underline">
        <ArrowLeft size={14} />
        Back to Account Projects
      </Link>
      <h1 className="text-2xl font-bold text-[var(--sec-ink)]">New account project</h1>
      <p className="mt-1 text-sm text-[var(--sec-muted)]">Once created, you can issue quotations, invoices and receipts under it.</p>
      <div className="mt-8 max-w-xl">
        <AccountProjectForm mode="create" initial={{ clientName: "", location: "Abu Dhabi - UAE", projectDetails: "" }} />
      </div>
    </div>
  );
}