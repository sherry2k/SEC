import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import ClientForm from "@/components/ClientForm";

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("accounts.edit");
  const { id } = await params;

  const [client] = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  if (!client) notFound();

  return (
    <div>
      <Link href={`/accounts/clients/${id}`} className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--sec-blue)] hover:underline">
        <ArrowLeft size={14} />
        Back to {client.name}
      </Link>
      <h1 className="text-2xl font-bold text-[var(--sec-ink)]">Edit client</h1>
      <p className="mt-1 text-sm text-[var(--sec-muted)]">
        This doesn&apos;t change the client name already printed on existing quotations, invoices, or receipt vouchers.
      </p>
      <div className="mt-8 max-w-xl">
        <ClientForm
          mode="edit"
          clientId={id}
          initial={{
            name: client.name,
            address: client.address ?? "",
            trn: client.trn ?? "",
            contactInfo: client.contactInfo ?? "",
            notes: client.notes ?? "",
          }}
        />
      </div>
    </div>
  );
}
