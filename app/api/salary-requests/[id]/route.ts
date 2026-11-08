import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { salaryRequests, salaryRequestItems } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("accounts.edit");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const [existing] = await db.select().from(salaryRequests).where(eq(salaryRequests.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Salary request not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const items: unknown[] = Array.isArray(body?.items) ? body.items : [];

  const rows = items
    .map((item, index) => {
      const record = item as Record<string, unknown>;
      const employeeName = str(record?.employeeName);
      const amount = Number(record?.amount);
      if (!employeeName || !Number.isFinite(amount) || amount <= 0) return null;
      const employeeIdRaw = str(record?.employeeId);
      const employeeId = employeeIdRaw ? Number(employeeIdRaw) : null;
      return {
        requestId: id,
        sortOrder: index,
        employeeId: employeeId && Number.isFinite(employeeId) ? employeeId : null,
        employeeName,
        designation: str(record?.designation) || null,
        amount: String(amount),
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (rows.length === 0) {
    return NextResponse.json({ error: "Add at least one employee with an amount." }, { status: 400 });
  }

  // Editing after slips were generated would silently detach the rows
  // from what's now been created — those links live in the Salary Slips
  // instead at that point, so edits are blocked once generated (the
  // Generate Slips button already hides edit once that's done; this is
  // the server-side version of the same rule). Checked before any write.
  if (existing.status === "generated") {
    return NextResponse.json({ error: "This request already generated Salary Slips and can't be edited." }, { status: 409 });
  }

  await db
    .update(salaryRequests)
    .set({
      payMonth: str(body?.payMonth) || existing.payMonth,
      notes: str(body?.notes) || null,
      updatedAt: new Date(),
    })
    .where(eq(salaryRequests.id, id));

  await db.delete(salaryRequestItems).where(eq(salaryRequestItems.requestId, id));
  await db.insert(salaryRequestItems).values(rows);

  await logActivity({ userId: auth.user.id, action: "salary_request_updated", targetName: existing.requestNo });

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("accounts.edit");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const [existing] = await db.select({ requestNo: salaryRequests.requestNo }).from(salaryRequests).where(eq(salaryRequests.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Salary request not found." }, { status: 404 });
  }

  await logActivity({ userId: auth.user.id, action: "salary_request_deleted", targetName: existing.requestNo });
  await db.delete(salaryRequests).where(eq(salaryRequests.id, id));

  return NextResponse.json({ success: true });
}
