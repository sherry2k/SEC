import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leaveRequests } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { nextDocumentCode } from "@/lib/sequences";
import { logActivity } from "@/lib/activity";
import { LEAVE_TYPES, LEAVE_TYPE_LABELS, countWorkingDays, type LeaveType } from "@/lib/leave";

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function isValidDateKey(v: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(`${v}T00:00:00.000Z`).getTime());
}

export async function POST(request: NextRequest) {
  const auth = await authorizePermissionApi("leave_requests.create");
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json().catch(() => null);
    const type = str(body?.type) as LeaveType;
    const startDate = str(body?.startDate);
    const endDate = str(body?.endDate);
    const reason = str(body?.reason);

    if (!LEAVE_TYPES.includes(type)) {
      return NextResponse.json({ error: "Choose a leave type." }, { status: 400 });
    }
    if (!isValidDateKey(startDate) || !isValidDateKey(endDate)) {
      return NextResponse.json({ error: "Enter a valid start and end date." }, { status: 400 });
    }
    if (endDate < startDate) {
      return NextResponse.json({ error: "End date can't be before the start date." }, { status: 400 });
    }

    const totalDays = countWorkingDays(startDate, endDate);
    if (totalDays === 0) {
      return NextResponse.json(
        { error: "That range doesn't include any working days (Mon–Sat)." },
        { status: 400 }
      );
    }

    const leaveNo = await nextDocumentCode("LV");

    const [row] = await db
      .insert(leaveRequests)
      .values({
        leaveNo,
        userId: auth.user.id,
        type,
        startDate: new Date(`${startDate}T00:00:00.000Z`),
        endDate: new Date(`${endDate}T00:00:00.000Z`),
        totalDays,
        reason: reason || null,
      })
      .returning();

    await logActivity({
      userId: auth.user.id,
      action: "leave_request_created",
      targetName: `${row.leaveNo} — ${LEAVE_TYPE_LABELS[type]} (${auth.user.name})`,
    });

    return NextResponse.json({ success: true, request: row }, { status: 201 });
  } catch (error) {
    console.error("Create leave request error:", error);
    return NextResponse.json({ error: "Something went wrong on the server. Try again." }, { status: 500 });
  }
}
