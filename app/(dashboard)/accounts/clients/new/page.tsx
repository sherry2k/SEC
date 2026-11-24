import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import ClientForm from "@/components/ClientForm";

export default async function NewClientPage() {
  await requirePermission("accounts.edit");

  return (
    <div>
      <Link href="/accounts/clients" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--sec-blue)] hover:underline">
        <ArrowLeft size={14} />
        Back to Clients
      </Link>
      <h1 className="text-2xl font-bold text-[var(--sec-ink)]">New client</h1>
      <p className="mt-1 text-sm text-[var(--sec-muted)]">Once added, you can create Account Projects under them without retyping their details.</p>
      <div className="mt-8 max-w-xl">
        <ClientForm mode="create" initial={{ name: "", address: "", trn: "", contactInfo: "", notes: "" }} />
      </div>
    </div>
  );
}
