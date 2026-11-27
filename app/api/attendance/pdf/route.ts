import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { generatePdf } from "@/lib/pdf";
import { buildHeaderTemplate, buildFooterTemplate } from "@/lib/pdf-templates";
import { uaeDateKey } from "@/lib/attendance";
import { weekRangeFor, monthRangeFor } from "@/lib/attendance-report";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  await requirePermission("attendance.view");

  const dateParam = request.nextUrl.searchParams.get("date");
  const rangeParam = request.nextUrl.searchParams.get("range");
  const userIdParam = request.nextUrl.searchParams.get("userId");
  const dateKey = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : uaeDateKey(new Date());
  const range = rangeParam === "month" ? "month" : "week";
  const singleUserId = userIdParam && /^\d+$/.test(userIdParam) ? Number(userIdParam) : null;

  const { label } = range === "week" ? weekRangeFor(dateKey) : monthRangeFor(dateKey);

  // A per-employee download (the Download PDF button on one selected
  // employee's card) names that person in both the filename and the
  // printed header's Ref. line.
  let employeeName: string | null = null;
  if (singleUserId) {
    const [person] = await db.select({ name: users.name }).from(users).where(eq(users.id, singleUserId)).limit(1);
    employeeName = person?.name ?? null;
  }

  const baseUrl = request.nextUrl.origin;
  const printUrl = `${baseUrl}/print/attendance?date=${dateKey}&range=${range}${singleUserId ? `&userId=${singleUserId}` : ""}`;
  const cookieHeader = request.headers.get("cookie") ?? "";

  const refValue = employeeName ? `Attendance — ${employeeName} — ${label}` : `Attendance — ${label}`;
  const headerTemplate = buildHeaderTemplate({
    dateLabel: "Date",
    dateValue: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }),
    refLabel: "Ref.",
    refValue,
  });
  const footerTemplate = buildFooterTemplate();

  const pdfBuffer = await generatePdf({ url: printUrl, cookieHeader, headerTemplate, footerTemplate });

  const filenameSlug = employeeName ? `-${employeeName.replace(/[^a-zA-Z0-9]+/g, "-")}` : "";
  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Attendance-${range}${filenameSlug}-${dateKey}.pdf"`,
    },
  });
}
