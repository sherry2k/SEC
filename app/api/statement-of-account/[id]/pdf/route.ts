import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { generatePdf } from "@/lib/pdf";
import { buildHeaderTemplate, buildFooterTemplate } from "@/lib/pdf-templates";
import { toFilenameSafe } from "@/lib/pdf-filename";

export const maxDuration = 60;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("accounts.view");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const [project] = await db
    .select({ projectCode: projects.projectCode, municipalityNo: projects.municipalityNo })
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);

  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const ref = project.municipalityNo || project.projectCode;
  const cookieHeader = request.headers.get("cookie") ?? "";
  const sourceUrl = new URL(`/print/statement-of-account/${id}`, request.nextUrl.origin).toString();

  const headerTemplate = buildHeaderTemplate({
    dateLabel: "Date",
    dateValue: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }),
    refLabel: "Ref.",
    refValue: ref,
  });
  const footerTemplate = buildFooterTemplate();

  try {
    const pdfBuffer = await generatePdf({ url: sourceUrl, cookieHeader, headerTemplate, footerTemplate });
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${toFilenameSafe(ref)}-Statement.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation failed:", error);
    return NextResponse.json({ error: "Couldn't generate the PDF. Try again in a moment." }, { status: 500 });
  }
}
