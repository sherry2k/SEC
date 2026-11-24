import Link from "next/link";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import AccountProjectForm from "@/components/AccountProjectForm";

export default async function NewAccountProjectPage({ searchParams }: { searchParams: Promise<{ clientId?: string }> }) {
  await requirePermission("accounts.edit");
  const { clientId } = await searchParams;

  // Arriving from a Client's "+ New project for this client" button — pick
  // up their name so the Client Picker starts already filled in, instead of
  // making the person search for the client they just came from.
  let preselected: { id: string; name: string } | null = null;
  if (clientId) {
    const [client] = await db.select({ id: clients.id, name: clients.name }).from(clients).where(eq(clients.id, clientId)).limit(1);
    if (client) preselected = client;
  }

  return (
    <div>
      <Link
        href={preselected ? `/accounts/clients/${preselected.id}` : "/accounts/account-projects"}
        className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--sec-blue)] hover:underline"
      >
        <ArrowLeft size={14} />
        {preselected ? `Back to ${preselected.name}` : "Back to Account Projects"}
      </Link>
      <h1 className="text-2xl font-bold text-[var(--sec-ink)]">New account project</h1>
      <p className="mt-1 text-sm text-[var(--sec-muted)]">Once created, you can issue quotations, invoices and receipts under it.</p>
      <div className="mt-8 max-w-xl">
        <AccountProjectForm
          mode="create"
          initial={{
            clientId: preselected?.id ?? "",
            clientName: preselected?.name ?? "",
            location: "Abu Dhabi - UAE",
            projectDetails: "",
            categories: [],
          }}
        />
      </div>
    </div>
  );
}
