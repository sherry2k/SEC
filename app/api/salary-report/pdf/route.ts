import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { generatePdf } from "@/lib/pdf";
import { buildHeaderTemplate, buildFooterTemplate } from "@/lib/pdf-templates";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  await requirePermission("accounts.view");

  const month = request.nextUrl.searchParams.get("month");
  const now = new Date();
  const monthKey = month && /^\d{4}-\d{2}$/.test(month) ? month : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthLabel = new Date(`${monthKey}-01T00:00:00`).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const baseUrl = request.nextUrl.origin;
  const printUrl = `${baseUrl}/print/salary-report?month=${monthKey}`;
  const cookieHeader = request.headers.get("cookie") ?? "";

  const headerTemplate = buildHeaderTemplate({
    dateLabel: "Date",
    dateValue: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }),
    refLabel: "Ref.",
    refValue: `Salary Report — ${monthLabel}`,
  });
  const footerTemplate = buildFooterTemplate();

  const pdfBuffer = await generatePdf({ url: printUrl, cookieHeader, headerTemplate, footerTemplate });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Salary-Report-${monthKey}.pdf"`,
    },
  });
}
