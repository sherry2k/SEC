import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { salarySlips } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { canViewSalarySlip } from "@/lib/salary-slip-access";
import { generatePdf } from "@/lib/pdf";
import { buildHeaderTemplate, buildFooterTemplate } from "@/lib/pdf-templates";
import { toFilenameSafe } from "@/lib/pdf-filename";

export const maxDuration = 60;

// Not gated by authorizePermissionApi("accounts.view") alone — unlike the
// other document PDF routes, an employee with no accounts.view permission
// can still download their own slip (see lib/salary-slip-access.ts).
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.status !== "approved") {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }

  const { id } = await params;
  const [slip] = await db
    .select({ slipNo: salarySlips.slipNo, issueDate: salarySlips.issueDate, employeeId: salarySlips.employeeId, status: salarySlips.status })
    .from(salarySlips)
    .where(eq(salarySlips.id, id))
    .limit(1);

  if (!slip) {
    return NextResponse.json({ error: "Salary slip not found." }, { status: 404 });
  }
  if (!canViewSalarySlip(user, slip.employeeId, slip.status)) {
    return NextResponse.json({ error: "You don't have access to this." }, { status: 403 });
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const sourceUrl = new URL(`/print/salary-slips/${id}`, request.nextUrl.origin).toString();

  const headerTemplate = buildHeaderTemplate({ dateLabel: "Date", dateValue: slip.issueDate, refLabel: "Ref. No.", refValue: slip.slipNo });
  const footerTemplate = buildFooterTemplate();

  try {
    const pdfBuffer = await generatePdf({ url: sourceUrl, cookieHeader, headerTemplate, footerTemplate });
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${toFilenameSafe(slip.slipNo)}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation failed:", error);
    return NextResponse.json({ error: "Couldn't generate the PDF. Try again in a moment." }, { status: 500 });
  }
}
