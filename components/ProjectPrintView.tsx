import PrintDocumentShell from "@/components/PrintDocumentShell";
import { CATEGORY_LABELS, ITEM_STATUS_LABELS, PROJECT_STATUS_LABELS, type ProjectCategory, type ItemStatus, type ProjectStatus } from "@/lib/checklist";

export type PrintableChecklistItem = {
  id: string;
  name: string;
  status: ItemStatus;
  parentItemId: string | null;
  dueDate: string | null;
  submittedByName: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  comments: { id: string; comment: string; authorName: string | null; createdAt: string }[];
};

export type PrintableSection = { category: ProjectCategory; items: PrintableChecklistItem[] };

export type PrintableProject = {
  projectCode: string;
  name: string;
  status: ProjectStatus;
  details: [string, string][];
  updatedAtLabel: string;
  updatedByDisplayName: string | null;
  completedByDisplayName: string | null;
  completedAtLabel: string | null;
  notes: string | null;
  sections: PrintableSection[];
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// A plain, purely presentational rendering of the same project data shown
// on screen — separate from the interactive page rather than reusing its
// components, since none of the editing/status controls make sense on
// paper. Wrapped in PrintDocumentShell so the letterhead repeats and the
// footer pins to the bottom on every page, same as Quotations/Invoices —
// not just a once-per-document header/footer like before.
export default function ProjectPrintView({ project }: { project: PrintableProject }) {
  return (
    <PrintDocumentShell
      dateLabel="Printed"
      dateValue={new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
      refLabel="Ref."
      refValue={project.projectCode}
    >
      <div className="mt-4 flex items-start justify-between gap-4">
        <h1 className="text-xl font-bold">{project.name}</h1>
        <span className="shrink-0 rounded-full border px-3 py-1 text-xs font-medium">
          {PROJECT_STATUS_LABELS[project.status]}
        </span>
      </div>

      {project.details.length > 0 && (
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-3">
          {project.details.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs uppercase tracking-wide text-[var(--sec-muted)]">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}

      <p className="mt-3 text-xs text-[var(--sec-muted)]">
        Last updated {project.updatedAtLabel}
        {project.updatedByDisplayName && ` by ${project.updatedByDisplayName}`}
      </p>
      {project.completedAtLabel && (
        <p className="mt-1 text-xs font-medium text-emerald-700">
          Completed{project.completedByDisplayName && ` by ${project.completedByDisplayName}`} on {project.completedAtLabel}
        </p>
      )}
      {project.notes && <p className="mt-3 text-sm">{project.notes}</p>}

      <h2 className="mt-6 text-base font-bold">Checklist</h2>

      {project.sections.map((section) => (
        <div key={section.category} className="mt-4">
          <p className="border-b border-[var(--sec-line)] pb-1 text-sm font-bold">{CATEGORY_LABELS[section.category]}</p>
          <div className="mt-1">
            {section.items.map((item) => {
              let creditLine: string | null = null;
              if (item.status === "approved" && item.approvedAt) {
                creditLine = item.submittedByName
                  ? `Submitted by ${item.submittedByName}${item.submittedAt ? ` - ${formatDate(item.submittedAt)}` : ""} - Approved ${formatDate(item.approvedAt)}`
                  : `Approved ${formatDate(item.approvedAt)}`;
              } else if (item.submittedByName && item.submittedAt) {
                creditLine = `Submitted by ${item.submittedByName} - ${formatDate(item.submittedAt)}`;
              }

              return (
                <div
                  key={item.id}
                  className="flex flex-wrap items-start justify-between gap-2 border-b border-[var(--sec-line)] py-1.5 text-sm last:border-0"
                  style={{ paddingLeft: item.parentItemId ? 16 : 0 }}
                >
                  <div>
                    <span>{item.name}</span>
                    {creditLine && <span className="block text-xs text-emerald-700">{creditLine}</span>}
                    {item.comments.map((c) => (
                      <span key={c.id} className="mt-0.5 block text-xs text-[var(--sec-muted)]">
                        "{c.comment}" - {c.authorName ?? "Someone"}, {formatDate(c.createdAt)}
                      </span>
                    ))}
                  </div>
                  <div className="shrink-0 text-right text-xs">
                    {item.dueDate && <span className="mr-2 text-[var(--sec-muted)]">Due {item.dueDate}</span>}
                    <span className="rounded-full border px-2 py-0.5 font-medium">{ITEM_STATUS_LABELS[item.status]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </PrintDocumentShell>
  );
}
