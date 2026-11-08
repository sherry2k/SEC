import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { salaryRequests, salaryRequestItems } from "@/db/schema";
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

    const requestNo = await nextDocumentCode("SREQ");

    const [reqRow] = await db
      .insert(salaryRequests)
      .values({
        requestNo,
        payMonth: str(body?.payMonth) || new Date().toISOString().slice(0, 7),
        notes: str(body?.notes) || null,
        createdBy: auth.user.id,
      })
      .returning();

    await db.insert(salaryRequestItems).values(rows.map((r) => ({ ...r, requestId: reqRow.id })));

    await logActivity({
      userId: auth.user.id,
      action: "salary_request_created",
      targetName: reqRow.requestNo,
    });

    return NextResponse.json({ success: true, request: reqRow }, { status: 201 });
  } catch (error) {
    console.error("Create salary request error:", error);
    return NextResponse.json({ error: "Something went wrong on the server. Try again." }, { status: 500 });
  }
}
