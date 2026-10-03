import PrintDocumentShell from "@/components/PrintDocumentShell";
import ProjectPrintBody, { type PrintableProject } from "@/components/ProjectPrintBody";

export type { PrintableChecklistItem, PrintableSection, PrintableProject } from "@/components/ProjectPrintBody";

// Wraps the bare content in PrintDocumentShell so the letterhead repeats
// and the footer pins to the bottom on every page — the normal in-app
// view/print path (browser print dialog). The server-side PDF generator
// uses ProjectPrintBody directly instead, on its own dedicated
// /print/projects/[id] page, since Puppeteer supplies the header/footer
// itself there.
export default function ProjectPrintView({ project }: { project: PrintableProject }) {
  return (
    <PrintDocumentShell
      dateLabel="Printed"
      dateValue={new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
      refLabel="Ref."
      refValue={project.projectCode}
    >
      <ProjectPrintBody project={project} />
    </PrintDocumentShell>
  );
}
