import type { PrintableProjectRow } from "@/lib/projects-print-data";

export default function ProjectsListPrintBody({ rows }: { rows: PrintableProjectRow[] }) {
  return (
    <>
      <h1 className="mt-2 text-center text-lg font-bold uppercase underline">Projects List</h1>
      <p className="mt-1 text-center text-sm text-[var(--sec-muted)]">
        {rows.length} {rows.length === 1 ? "project" : "projects"}
      </p>

      <table className="mt-4 w-full border-collapse text-xs">
        <thead>
          <tr className="bg-[var(--sec-blue-deep)] text-white">
            <th className="border border-[var(--sec-blue-deep)] px-2 py-1.5 text-left">Project No.</th>
            <th className="border border-[var(--sec-blue-deep)] px-2 py-1.5 text-left">Name</th>
            <th className="border border-[var(--sec-blue-deep)] px-2 py-1.5 text-left">Client</th>
            <th className="border border-[var(--sec-blue-deep)] px-2 py-1.5 text-left">Categories</th>
            <th className="border border-[var(--sec-blue-deep)] px-2 py-1.5 text-left">Status</th>
            <th className="border border-[var(--sec-blue-deep)] px-2 py-1.5 text-left">Responsible</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p, i) => (
            <tr key={i}>
              <td className="border border-[var(--sec-line)] px-2 py-1 align-top">{p.municipalityNo || p.projectCode}</td>
              <td className="border border-[var(--sec-line)] px-2 py-1 align-top">{p.name}</td>
              <td className="border border-[var(--sec-line)] px-2 py-1 align-top">{p.clientName || "—"}</td>
              <td className="border border-[var(--sec-line)] px-2 py-1 align-top">{p.categoryLabels || "—"}</td>
              <td className="border border-[var(--sec-line)] px-2 py-1 align-top">{p.statusLabel}</td>
              <td className="border border-[var(--sec-line)] px-2 py-1 align-top">{p.responsibleName || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
