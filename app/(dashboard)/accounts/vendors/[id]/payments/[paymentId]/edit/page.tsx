import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, asc } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { vendors, vendorPayments, accountProjects } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import VendorPaymentForm from "@/components/VendorPaymentForm";
import type { VendorPaymentStatus } from "@/lib/vendor-payment-status";

export default async function EditVendorPaymentPage({ params }: { params: Promise<{ id: string; paymentId: string }> }) {
  await requirePermission("accounts.edit");
  const { id, paymentId } = await params;

  const [vendor] = await db.select({ id: vendors.id, name: vendors.name }).from(vendors).where(eq(vendors.id, id)).limit(1);
  if (!vendor) notFound();

  const [payment] = await db.select().from(vendorPayments).where(eq(vendorPayments.id, paymentId)).limit(1);
  if (!payment || payment.vendorId !== id) notFound();

  const projects = await db.select({ id: accountProjects.id, clientName: accountProjects.clientName }).from(accountProjects).orderBy(asc(accountProjects.clientName));

  return (
    <div>
      <Link href={`/accounts/vendors/${id}`} className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--sec-blue)] hover:underline">
        <ArrowLeft size={14} />
        Back to {vendor.name}
      </Link>
      <h1 className="text-2xl font-bold text-[var(--sec-ink)]">Edit payment — {vendor.name}</h1>
      <div className="mt-8 max-w-xl">
        <VendorPaymentForm
          mode="edit"
          vendorId={id}
          paymentId={paymentId}
          accountProjects={projects}
          initial={{
            paymentDate: payment.paymentDate,
            amount: String(payment.amount),
            accountProjectId: payment.accountProjectId ?? "",
            description: payment.description ?? "",
            status: payment.status as VendorPaymentStatus,
          }}
        />
      </div>
    </div>
  );
}
