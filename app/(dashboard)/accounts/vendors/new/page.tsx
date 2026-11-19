import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import VendorForm from "@/components/VendorForm";

export default async function NewVendorPage() {
  await requirePermission("accounts.edit");

  return (
    <div>
      <Link href="/accounts/vendors" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--sec-blue)] hover:underline">
        <ArrowLeft size={14} />
        Back to Vendors
      </Link>
      <h1 className="text-2xl font-bold text-[var(--sec-ink)]">New vendor</h1>
      <p className="mt-1 text-sm text-[var(--sec-muted)]">Once added, you can log payments against it and tag each one to a project.</p>
      <div className="mt-8 max-w-xl">
        <VendorForm mode="create" initial={{ name: "", category: "", contactInfo: "", notes: "" }} />
      </div>
    </div>
  );
}
