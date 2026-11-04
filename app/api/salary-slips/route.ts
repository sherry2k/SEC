import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { salarySlips, salarySlipItems } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { nextDocumentCode } from "@/lib/sequences";
import { logActivity } from "@/lib/activity";

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(request: NextRequest) {
  const auth = await authorizePermissionApi("accounts.edit");
  if (!auth.ok) return auth.response;

  try {
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
        return { sortOrder: index, type, description, amount: String(amount) };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    if (rows.length === 0) {
      return NextResponse.json({ error: "Add at least one valid earning or deduction line." }, { status: 400 });
    }

    const employeeIdRaw = str(body?.employeeId);
    const employeeId = employeeIdRaw ? Number(employeeIdRaw) : null;
    const slipNo = await nextDocumentCode("SAL");

    const [slip] = await db
      .insert(salarySlips)
      .values({
        slipNo,
        employeeId: employeeId && Number.isFinite(employeeId) ? employeeId : null,
        employeeName,
        designation: str(body?.designation) || null,
        payMonth: str(body?.payMonth) || new Date().toISOString().slice(0, 7),
        issueDate: str(body?.issueDate) || new Date().toLocaleDateString("en-GB"),
        signatoryName: str(body?.signatoryName) || null,
        showStamp: Boolean(body?.showStamp),
        notes: str(body?.notes) || null,
        createdBy: auth.user.id,
        updatedBy: auth.user.id,
      })
      .returning();

    await db.insert(salarySlipItems).values(rows.map((r) => ({ ...r, slipId: slip.id })));

    await logActivity({
      userId: auth.user.id,
      action: "salary_slip_created",
      targetName: `${slip.slipNo} — ${employeeName}`,
    });

    return NextResponse.json({ success: true, slip }, { status: 201 });
  } catch (error) {
    console.error("Create salary slip error:", error);
    return NextResponse.json({ error: "Something went wrong on the server. Try again." }, { status: 500 });
  }
}
