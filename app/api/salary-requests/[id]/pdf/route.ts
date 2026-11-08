import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { salaryRequests } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { generatePdf } from "@/lib/pdf";
import { buildHeaderTemplate, buildFooterTemplate } from "@/lib/pdf-templates";
import { toFilenameSafe } from "@/lib/pdf-filename";

export const maxDuration = 60;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requirePermission("accounts.view");

  const { id } = await params;
  const [reqRow] = await db.select({ requestNo: salaryRequests.requestNo }).from(salaryRequests).where(eq(salaryRequests.id, id)).limit(1);
  if (!reqRow) {
    return NextResponse.json({ error: "Salary request not found." }, { status: 404 });
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const sourceUrl = new URL(`/print/salary-requests/${id}`, request.nextUrl.origin).toString();

  const headerTemplate = buildHeaderTemplate({
    dateLabel: "Date",
    dateValue: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }),
    refLabel: "Ref. No.",
    refValue: reqRow.requestNo,
  });
  const footerTemplate = buildFooterTemplate();

  try {
    const pdfBuffer = await generatePdf({ url: sourceUrl, cookieHeader, headerTemplate, footerTemplate });
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${toFilenameSafe(reqRow.requestNo)}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation failed:", error);
    return NextResponse.json({ error: "Couldn't generate the PDF. Try again in a moment." }, { status: 500 });
  }
}
