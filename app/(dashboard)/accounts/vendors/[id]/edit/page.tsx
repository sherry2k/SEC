import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { vendors } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import VendorForm from "@/components/VendorForm";

export default async function EditVendorPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("accounts.edit");
  const { id } = await params;

  const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id)).limit(1);
  if (!vendor) notFound();

  return (
    <div>
      <Link href={`/accounts/vendors/${id}`} className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--sec-blue)] hover:underline">
        <ArrowLeft size={14} />
        Back to {vendor.name}
      </Link>
      <h1 className="text-2xl font-bold text-[var(--sec-ink)]">Edit vendor</h1>
      <div className="mt-8 max-w-xl">
        <VendorForm
          mode="edit"
          vendorId={id}
          initial={{
            name: vendor.name,
            category: vendor.category ?? "",
            contactInfo: vendor.contactInfo ?? "",
            notes: vendor.notes ?? "",
          }}
        />
      </div>
    </div>
  );
}
