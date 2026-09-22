import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { performaInvoices } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { generatePdf } from "@/lib/pdf";
import { buildHeaderTemplate, buildFooterTemplate } from "@/lib/pdf-templates";
import { toFilenameSafe } from "@/lib/pdf-filename";

export const maxDuration = 60;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("accounts.view");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const [invoice] = await db
    .select({ invoiceNo: performaInvoices.invoiceNo, issueDate: performaInvoices.issueDate })
    .from(performaInvoices)
    .where(eq(performaInvoices.id, id))
    .limit(1);

  if (!invoice) {
    return NextResponse.json({ error: "Performa invoice not found." }, { status: 404 });
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const sourceUrl = new URL(`/print/performa-invoices/${id}`, request.nextUrl.origin).toString();

  const headerTemplate = buildHeaderTemplate({ dateLabel: "Date", dateValue: invoice.issueDate, refLabel: "Ref. No.", refValue: invoice.invoiceNo });
  const footerTemplate = buildFooterTemplate();

  try {
    const pdfBuffer = await generatePdf({ url: sourceUrl, cookieHeader, headerTemplate, footerTemplate });
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${toFilenameSafe(invoice.invoiceNo)}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation failed:", error);
    return NextResponse.json({ error: "Couldn't generate the PDF. Try again in a moment." }, { status: 500 });
  }
}
