import { eq } from "drizzle-orm";
import { db } from "@/db";
import { leaveRequests } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import LeaveRequestsTabs from "@/components/LeaveRequestsTabs";

export default async function LeaveRequestsLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePermission("leave_requests.create");
  const canReview = can(user.role, "leave_requests.review");

  let pendingCount = 0;
  if (canReview) {
    const pending = await db.select({ id: leaveRequests.id }).from(leaveRequests).where(eq(leaveRequests.status, "pending"));
    pendingCount = pending.length;
  }

  return (
    <div>
      <LeaveRequestsTabs canReview={canReview} pendingCount={pendingCount} />
      {children}
    </div>
  );
}
