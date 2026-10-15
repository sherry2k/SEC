import {
  CATEGORY_LABELS,
  CATEGORY_ACCENT_BORDER,
  ITEM_STATUS_LABELS,
  ITEM_STATUS_STYLES,
  PROJECT_STATUS_LABELS,
  type ProjectCategory,
  type ItemStatus,
  type ProjectStatus,
} from "@/lib/checklist";

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

export type PrintableSection = { category: ProjectCategory; note: string | null; items: PrintableChecklistItem[] };

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

// Mirrors CategoryNoteField's own label config (components/CategoryNoteField.tsx)
// — kept separate since that component is a client component built around
// an editable input, while this is a plain read-only line on the printed
// page. Add a category here when CategoryNoteField gains one too.
const CATEGORY_NOTE_LABELS: Partial<Record<ProjectCategory, string>> = {
  contractor: "Assigned Contractor",
  archives: "Archive Project No.",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// Just the document content — no letterhead, no footer. Used two ways:
// wrapped in PrintDocumentShell by ProjectPrintView for the normal in-app
// view/print (browser print dialog), and standalone on the dedicated
// /print/projects/[id] page the server-side PDF generator loads, where
// Puppeteer supplies the header/footer itself. Same split every other
// document type (Quotation, Invoice, etc.) already uses, and for the same
// reason — rendering both the shell and Puppeteer's own header/footer at
// once would double up the letterhead.
//
// Deliberately styled to match the on-screen Project page (category cards
// with their colored left border, real colored status pills) rather than a
// generic plain document — same classes as ProjectChecklist/ChecklistItemRow
// use, just the read-only shape since nothing here is interactive.
export default function ProjectPrintBody({ project }: { project: PrintableProject }) {
  return (
    <>
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

      <div className="mt-3 space-y-4">
        {project.sections.map((section) => {
          const noteLabel = CATEGORY_NOTE_LABELS[section.category];
          return (
            <div
              key={section.category}
              className={`rounded-lg border border-l-4 border-[var(--sec-line)] ${CATEGORY_ACCENT_BORDER[section.category]}`}
              style={{ breakInside: "avoid" }}
            >
              <div className="border-b border-[var(--sec-line)] px-3 py-2">
                <p className="text-sm font-bold">{CATEGORY_LABELS[section.category]}</p>
                {section.note && noteLabel && (
                  <p className="mt-0.5 text-xs text-[var(--sec-muted)]">
                    {noteLabel}: <span className="text-[var(--sec-ink)]">{section.note}</span>
                  </p>
                )}
              </div>
              <div className="px-3 py-1">
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
                        <span>
                          {item.parentItemId && <span className="mr-1 text-[var(--sec-line)]">└</span>}
                          {item.name}
                        </span>
                        {creditLine && <span className="block text-xs text-emerald-700">{creditLine}</span>}
                        {item.comments.map((c) => (
                          <span key={c.id} className="mt-0.5 block text-xs text-[var(--sec-muted)]">
                            "{c.comment}" - {c.authorName ?? "Someone"}, {formatDate(c.createdAt)}
                          </span>
                        ))}
                      </div>
                      <div className="shrink-0 text-right text-xs">
                        {item.dueDate && <span className="mr-2 text-[var(--sec-muted)]">Due {item.dueDate}</span>}
                        <span className={`rounded-full border px-2.5 py-0.5 font-medium ${ITEM_STATUS_STYLES[item.status]}`}>
                          {ITEM_STATUS_LABELS[item.status]}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
