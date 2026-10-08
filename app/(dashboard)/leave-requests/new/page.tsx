import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import LeaveRequestForm from "@/components/LeaveRequestForm";

export default async function NewLeaveRequestPage() {
  await requirePermission("leave_requests.create");

  return (
    <div>
      <Link href="/leave-requests" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--sec-blue)] hover:underline">
        <ArrowLeft size={14} />
        Back to my requests
      </Link>
      <h1 className="text-2xl font-bold text-[var(--sec-ink)]">New leave request</h1>
      <p className="mt-1 text-sm text-[var(--sec-muted)]">An admin will review this once submitted.</p>

      <div className="mt-6">
        <LeaveRequestForm />
      </div>
    </div>
  );
}
