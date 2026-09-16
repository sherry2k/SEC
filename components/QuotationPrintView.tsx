import { calcItemTotals, groupByClassification, calcGrandTotals } from "@/lib/quotation-calc";
import { amountToWordsAED } from "@/lib/number-to-words";
import { COMPANY } from "@/lib/company";
import PrintDocumentShell from "@/components/PrintDocumentShell";

export type PrintableItem = {
  description: string;
  classification: string;
  feeExclVat: number;
  scopeOfWork: string;
  duration: string;
};

export type PrintableQuotation = {
  quotationNo: string;
  title: string;
  subtitle: string;
  attention: string;
  clientName: string;
  projectDescription: string;
  location: string;
  buildingConfig: string;
  vatRatePercent: number;
  intro: string;
  paymentTerms: string;
  commercialConditions: string;
  notes: string;
  signatoryName: string;
  signatoryTitle: string;
  createdAt: Date;
  items: PrintableItem[];
};

function money(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2 });
}

export default function QuotationPrintView({ quotation }: { quotation: PrintableQuotation }) {
  const totals = calcGrandTotals(quotation.items, quotation.vatRatePercent);
  const groups = groupByClassification(quotation.items, quotation.vatRatePercent);
  const itemsWithScope = quotation.items.filter((i) => i.scopeOfWork.trim());

  const details = [
    ["Attention", quotation.attention],
    ["Client", quotation.clientName],
    ["Project", quotation.projectDescription],
    ["Location", quotation.location],
    ["Building Configuration", quotation.buildingConfig],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <PrintDocumentShell
      dateLabel="Date"
      dateValue={quotation.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
      refLabel="Ref."
      refValue={quotation.quotationNo}
    >
      <div className="mt-6 text-center">
        <h1 className="text-xl font-bold text-[var(--sec-ink)]">{quotation.title}</h1>
        {quotation.subtitle && <p className="mt-1 text-sm font-medium text-[var(--sec-blue)]">{quotation.subtitle}</p>}
      </div>

      {/* Details table */}
      {details.length > 0 && (
        <table className="mt-6 w-full border-collapse text-sm">
          <tbody>
            {details.map(([label, value]) => (
              <tr key={label} className="border border-[var(--sec-line)]">
                <td className="w-48 border border-[var(--sec-line)] bg-slate-50 px-3 py-2 font-semibold">{label}</td>
                <td className="border border-[var(--sec-line)] px-3 py-2">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {quotation.intro && <p className="mt-5 text-sm text-[var(--sec-ink)]">{quotation.intro}</p>}

      {/* Pricing schedule */}
      <p className="mt-6 text-center text-sm font-bold text-[var(--sec-ink)]">Pricing Schedule</p>
      <table className="mt-2 w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[var(--sec-blue-deep)] text-white">
            <th className="border border-[var(--sec-blue-deep)] px-2 py-2 text-left">No.</th>
            <th className="border border-[var(--sec-blue-deep)] px-2 py-2 text-left">Service</th>
            <th className="border border-[var(--sec-blue-deep)] px-2 py-2 text-left">Classification</th>
            <th className="border border-[var(--sec-blue-deep)] px-2 py-2 text-right">Fee Excl. VAT</th>
            <th className="border border-[var(--sec-blue-deep)] px-2 py-2 text-right">VAT {quotation.vatRatePercent}%</th>
            <th className="border border-[var(--sec-blue-deep)] px-2 py-2 text-right">Total Incl. VAT</th>
          </tr>
        </thead>
        <tbody>
          {quotation.items.map((item, index) => {
            const { vatAmount, totalInclVat } = calcItemTotals(item.feeExclVat, quotation.vatRatePercent);
            return (
              <tr key={index}>
                <td className="border border-[var(--sec-line)] px-2 py-2">{index + 1}</td>
                <td className="border border-[var(--sec-line)] px-2 py-2">{item.description}</td>
                <td className="border border-[var(--sec-line)] px-2 py-2">{item.classification}</td>
                <td className="border border-[var(--sec-line)] px-2 py-2 text-right">AED {money(item.feeExclVat)}</td>
                <td className="border border-[var(--sec-line)] px-2 py-2 text-right">AED {money(vatAmount)}</td>
                <td className="border border-[var(--sec-line)] px-2 py-2 text-right font-semibold">AED {money(totalInclVat)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="mt-3 text-right text-sm font-bold text-[var(--sec-ink)]">
        Grand Total: AED {money(totals.grandTotal)} including {quotation.vatRatePercent}% VAT.
      </p>

      {/* Per-item detailed scope, only for items where it was filled in */}
      {itemsWithScope.length > 0 &&
        itemsWithScope.map((item, i) => {
          const index = quotation.items.indexOf(item);
          const { vatAmount, totalInclVat } = calcItemTotals(item.feeExclVat, quotation.vatRatePercent);
          const scopeLines = item.scopeOfWork.split("\n").map((l) => l.trim()).filter(Boolean);
          return (
            <div key={i} className="mt-8 break-inside-avoid">
              <p className="font-bold text-[var(--sec-ink)]">
                {index + 1} {item.description}
              </p>
              {item.classification && (
                <p className="text-sm">
                  <span className="font-semibold">Classification:</span> {item.classification}
                </p>
              )}
              <p className="mt-2 text-sm font-bold text-[var(--sec-blue)]">Scope of Work</p>
              <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-sm">
                {scopeLines.map((line, li) => (
                  <li key={li}>{line}</li>
                ))}
              </ol>

              <table className="mt-3 w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[var(--sec-blue-deep)] text-white">
                    <th className="border border-[var(--sec-blue-deep)] px-2 py-1.5 text-left">Professional Fee</th>
                    <th className="border border-[var(--sec-blue-deep)] px-2 py-1.5 text-left">VAT {quotation.vatRatePercent}%</th>
                    <th className="border border-[var(--sec-blue-deep)] px-2 py-1.5 text-left">Total Including VAT</th>
                    {item.duration && <th className="border border-[var(--sec-blue-deep)] px-2 py-1.5 text-left">Duration</th>}
                  </tr>
                </thead>
                <tbody>
                  <tr className="font-semibold">
                    <td className="border border-[var(--sec-line)] px-2 py-1.5">AED {money(item.feeExclVat)}</td>
                    <td className="border border-[var(--sec-line)] px-2 py-1.5">AED {money(vatAmount)}</td>
                    <td className="border border-[var(--sec-line)] px-2 py-1.5">AED {money(totalInclVat)}</td>
                    {item.duration && <td className="border border-[var(--sec-line)] px-2 py-1.5">{item.duration}</td>}
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })}

      {/* Financial summary */}
      <p className="mt-8 text-center text-sm font-bold text-[var(--sec-ink)]">Financial Summary</p>
      <table className="mt-2 w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-[var(--sec-line)] px-2 py-2 text-left">Category</th>
            <th className="border border-[var(--sec-line)] px-2 py-2 text-right">Subtotal</th>
            <th className="border border-[var(--sec-line)] px-2 py-2 text-right">VAT {quotation.vatRatePercent}%</th>
            <th className="border border-[var(--sec-line)] px-2 py-2 text-right">Total Including VAT</th>
          </tr>
        </thead>
        <tbody>
          {groups.length > 1 &&
            groups.map((g) => (
              <tr key={g.label}>
                <td className="border border-[var(--sec-line)] px-2 py-2">{g.label}</td>
                <td className="border border-[var(--sec-line)] px-2 py-2 text-right">AED {money(g.subtotal)}</td>
                <td className="border border-[var(--sec-line)] px-2 py-2 text-right">AED {money(g.vatTotal)}</td>
                <td className="border border-[var(--sec-line)] px-2 py-2 text-right">AED {money(g.grandTotal)}</td>
              </tr>
            ))}
          <tr className="font-bold">
            <td className="border border-[var(--sec-line)] px-2 py-2">Grand Total</td>
            <td className="border border-[var(--sec-line)] px-2 py-2 text-right">AED {money(totals.subtotal)}</td>
            <td className="border border-[var(--sec-line)] px-2 py-2 text-right">AED {money(totals.vatTotal)}</td>
            <td className="border border-[var(--sec-line)] px-2 py-2 text-right">AED {money(totals.grandTotal)}</td>
          </tr>
        </tbody>
      </table>

      <p className="mt-4 text-sm">
        <span className="font-bold">Amount in Words:</span> {amountToWordsAED(totals.grandTotal)} INCLUDING VAT.
      </p>

      {quotation.paymentTerms && (
        <div className="mt-6">
          <p className="text-center text-sm font-bold">Payment Terms</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">
            {quotation.paymentTerms.split("\n").map((l) => l.trim()).filter(Boolean).map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      {quotation.commercialConditions && (
        <div className="mt-5">
          <p className="text-center text-sm font-bold">Commercial Conditions</p>
          <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-sm">
            {quotation.commercialConditions.split("\n").map((l) => l.trim()).filter(Boolean).map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
        </div>
      )}

      {quotation.notes && (
        <div className="mt-5">
          <p className="text-center text-sm font-bold">Notes</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">
            {quotation.notes.split("\n").map((l) => l.trim()).filter(Boolean).map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 text-sm">
        <p>For and on behalf of</p>
        <p className="font-bold">{COMPANY.legalName}</p>
        {quotation.signatoryName && <p className="mt-3 font-semibold">{quotation.signatoryName}</p>}
        {quotation.signatoryTitle && <p>{quotation.signatoryTitle}</p>}
      </div>
    </PrintDocumentShell>
  );
}
