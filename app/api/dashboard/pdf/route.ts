import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { generatePdf } from "@/lib/pdf";
import { buildHeaderTemplate, buildFooterTemplate } from "@/lib/pdf-templates";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  await requireRole();

  const baseUrl = request.nextUrl.origin;
  const printUrl = `${baseUrl}/print/dashboard`;
  const cookieHeader = request.headers.get("cookie") ?? "";

  const headerTemplate = buildHeaderTemplate({
    dateLabel: "Date",
    dateValue: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }),
    refLabel: "Ref.",
    refValue: "Overview",
  });
  const footerTemplate = buildFooterTemplate();

  const pdfBuffer = await generatePdf({ url: printUrl, cookieHeader, headerTemplate, footerTemplate });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Overview-Summary.pdf"`,
    },
  });
}
