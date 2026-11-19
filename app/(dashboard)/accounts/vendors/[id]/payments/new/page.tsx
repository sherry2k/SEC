import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, asc } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { vendors, accountProjects } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import VendorPaymentForm from "@/components/VendorPaymentForm";

function todayFormatted(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export default async function NewVendorPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("accounts.edit");
  const { id } = await params;

  const [vendor] = await db.select({ id: vendors.id, name: vendors.name }).from(vendors).where(eq(vendors.id, id)).limit(1);
  if (!vendor) notFound();

  const projects = await db.select({ id: accountProjects.id, clientName: accountProjects.clientName }).from(accountProjects).orderBy(asc(accountProjects.clientName));

  return (
    <div>
      <Link href={`/accounts/vendors/${id}`} className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--sec-blue)] hover:underline">
        <ArrowLeft size={14} />
        Back to {vendor.name}
      </Link>
      <h1 className="text-2xl font-bold text-[var(--sec-ink)]">New payment — {vendor.name}</h1>
      <p className="mt-1 text-sm text-[var(--sec-muted)]">Mark it "Paid" once it's actually gone out — that's what counts it as an expense.</p>
      <div className="mt-8 max-w-xl">
        <VendorPaymentForm
          mode="create"
          vendorId={id}
          accountProjects={projects}
          initial={{ paymentDate: todayFormatted(), amount: "", accountProjectId: "", description: "", status: "pending" }}
        />
      </div>
    </div>
  );
}
