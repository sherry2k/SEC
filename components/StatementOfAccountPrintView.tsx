import PrintDocumentShell from "@/components/PrintDocumentShell";
import StatementOfAccountPrintBody, { type StatementOfAccountData } from "@/components/StatementOfAccountPrintBody";

export type { StatementOfAccountData } from "@/components/StatementOfAccountPrintBody";

export default function StatementOfAccountPrintView({ data }: { data: StatementOfAccountData }) {
  return (
    <PrintDocumentShell dateLabel="Date" dateValue={data.printedDate} refLabel="Ref." refValue={data.projectRef}>
      <StatementOfAccountPrintBody data={data} />
    </PrintDocumentShell>
  );
}
