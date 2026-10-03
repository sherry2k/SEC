import { NextRequest, NextResponse } from "next/server";
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
  const dateKey = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : uaeDateKey(new Date());
  const range = rangeParam === "month" ? "month" : "week";

  const { label } = range === "week" ? weekRangeFor(dateKey) : monthRangeFor(dateKey);

  const baseUrl = request.nextUrl.origin;
  const printUrl = `${baseUrl}/print/attendance?date=${dateKey}&range=${range}`;
  const cookieHeader = request.headers.get("cookie") ?? "";

  const headerTemplate = buildHeaderTemplate({
    dateLabel: "Date",
    dateValue: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }),
    refLabel: "Ref.",
    refValue: `Attendance — ${label}`,
  });
  const footerTemplate = buildFooterTemplate();

  const pdfBuffer = await generatePdf({ url: printUrl, cookieHeader, headerTemplate, footerTemplate });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Attendance-${range}-${dateKey}.pdf"`,
    },
  });
}
