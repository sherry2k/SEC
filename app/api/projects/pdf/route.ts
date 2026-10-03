import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { generatePdf } from "@/lib/pdf";
import { buildHeaderTemplate, buildFooterTemplate } from "@/lib/pdf-templates";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  await requirePermission("projects.view");

  const baseUrl = request.nextUrl.origin;
  const printUrl = `${baseUrl}/print/projects`;
  const cookieHeader = request.headers.get("cookie") ?? "";

  const headerTemplate = buildHeaderTemplate({
    dateLabel: "Date",
    dateValue: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }),
    refLabel: "Ref.",
    refValue: "Projects List",
  });
  const footerTemplate = buildFooterTemplate();

  const pdfBuffer = await generatePdf({ url: printUrl, cookieHeader, headerTemplate, footerTemplate });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Projects-List.pdf"`,
    },
  });
}
