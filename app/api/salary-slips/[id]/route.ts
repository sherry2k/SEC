import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { salarySlips, salarySlipItems } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("accounts.edit");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const [existing] = await db
    .select({ id: salarySlips.id, slipNo: salarySlips.slipNo, issueDate: salarySlips.issueDate })
    .from(salarySlips)
    .where(eq(salarySlips.id, id))
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Salary slip not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const employeeName = str(body?.employeeName);
  const items: unknown[] = Array.isArray(body?.items) ? body.items : [];

  if (!employeeName) {
    return NextResponse.json({ error: "Employee name is required." }, { status: 400 });
  }

  const rows = items
    .map((item, index) => {
      const record = item as Record<string, unknown>;
      const type = record?.type === "deduction" ? "deduction" : "earning";
      const description = str(record?.description);
      const amount = Number(record?.amount);
      if (!description || !Number.isFinite(amount)) return null;
      return { slipId: id, sortOrder: index, type, description, amount: String(amount) };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (rows.length === 0) {
    return NextResponse.json({ error: "Add at least one valid earning or deduction line." }, { status: 400 });
  }

  const employeeIdRaw = str(body?.employeeId);
  const employeeId = employeeIdRaw ? Number(employeeIdRaw) : null;

  await db
    .update(salarySlips)
    .set({
      employeeId: employeeId && Number.isFinite(employeeId) ? employeeId : null,
      employeeName,
      designation: str(body?.designation) || null,
      payMonth: str(body?.payMonth) || undefined,
      issueDate: str(body?.issueDate) || existing.issueDate,
      signatoryName: str(body?.signatoryName) || null,
      showStamp: Boolean(body?.showStamp),
      notes: str(body?.notes) || null,
      status: str(body?.status) || undefined,
      updatedBy: auth.user.id,
      updatedAt: new Date(),
    })
    .where(eq(salarySlips.id, id));

  await db.delete(salarySlipItems).where(eq(salarySlipItems.slipId, id));
  await db.insert(salarySlipItems).values(rows);

  await logActivity({
    userId: auth.user.id,
    action: "salary_slip_updated",
    targetName: `${existing.slipNo} — ${employeeName}`,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("accounts.edit");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const [slip] = await db
    .select({ slipNo: salarySlips.slipNo, employeeName: salarySlips.employeeName })
    .from(salarySlips)
    .where(eq(salarySlips.id, id))
    .limit(1);

  if (!slip) {
    return NextResponse.json({ error: "Salary slip not found." }, { status: 404 });
  }

  await logActivity({
    userId: auth.user.id,
    action: "salary_slip_deleted",
    targetName: `${slip.slipNo} — ${slip.employeeName}`,
  });

  await db.delete(salarySlips).where(eq(salarySlips.id, id));

  return NextResponse.json({ success: true });
}
