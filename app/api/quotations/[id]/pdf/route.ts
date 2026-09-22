import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { quotations } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { generatePdf } from "@/lib/pdf";
import { buildHeaderTemplate, buildFooterTemplate } from "@/lib/pdf-templates";
import { toFilenameSafe } from "@/lib/pdf-filename";

// Vercel's default serverless function timeout (10s on Hobby) is too
// tight for launching a real browser — this raises the ceiling for this
// specific route. Needs a plan that actually grants more than 10s to take
// effect; if the account is still on the default, this line alone won't
// help, but it's a one-line fix if it comes to that.
export const maxDuration = 60;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("accounts.view");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const [quotation] = await db
    .select({ quotationNo: quotations.quotationNo, createdAt: quotations.createdAt })
    .from(quotations)
    .where(eq(quotations.id, id))
    .limit(1);

  if (!quotation) {
    return NextResponse.json({ error: "Quotation not found." }, { status: 404 });
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const sourceUrl = new URL(`/print/quotations/${id}`, request.nextUrl.origin).toString();

  const headerTemplate = buildHeaderTemplate({
    dateLabel: "Date",
    dateValue: quotation.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }),
    refLabel: "Ref.",
    refValue: quotation.quotationNo,
  });
  const footerTemplate = buildFooterTemplate();

  try {
    const pdfBuffer = await generatePdf({ url: sourceUrl, cookieHeader, headerTemplate, footerTemplate });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${toFilenameSafe(quotation.quotationNo)}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation failed:", error);
    return NextResponse.json({ error: "Couldn't generate the PDF. Try again in a moment." }, { status: 500 });
  }
}
