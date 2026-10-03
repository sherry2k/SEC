import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { generatePdf } from "@/lib/pdf";
import { buildHeaderTemplate, buildFooterTemplate } from "@/lib/pdf-templates";
import { toFilenameSafe } from "@/lib/pdf-filename";

export const maxDuration = 60;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requirePermission("projects.view");
  const { id } = await params;

  const [project] = await db.select({ projectCode: projects.projectCode }).from(projects).where(eq(projects.id, id)).limit(1);
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const baseUrl = request.nextUrl.origin;
  const printUrl = `${baseUrl}/print/projects/${id}`;
  const cookieHeader = request.headers.get("cookie") ?? "";

  const headerTemplate = buildHeaderTemplate({
    dateLabel: "Printed",
    dateValue: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }),
    refLabel: "Ref.",
    refValue: project.projectCode,
  });
  const footerTemplate = buildFooterTemplate();

  const pdfBuffer = await generatePdf({ url: printUrl, cookieHeader, headerTemplate, footerTemplate });

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${toFilenameSafe(project.projectCode)}.pdf"`,
    },
  });
}
