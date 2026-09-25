import { BANK_DETAILS } from "@/lib/company";
import type { PrintableQuotation } from "@/components/QuotationPrintBody";

function Blank({ width = "w-48" }: { width?: string }) {
  return <span className={`inline-block border-b border-[var(--sec-ink)] ${width}`}>&nbsp;</span>;
}

function money(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2 });
}

const linesOf = (text: string) => text.split("\n").map((l) => l.trim()).filter(Boolean);

// The category-based (BOC/CBC/Permit/Work Permit) layout — fixed
// sections copied from that category's template at creation time, plus
// editable prices, rendered into a Commercial Summary & Payment Schedule
// table computed automatically rather than typed by hand.
export default function QuotationCategoryPrintBody({ quotation }: { quotation: PrintableQuotation }) {
  const vat = quotation.vatRatePercent / 100;
  const scopeFee = quotation.scopeFeeExclVat;
  const downPayment = Math.round((scopeFee / 2) * 100) / 100;
  const balance = scopeFee - downPayment;
  const createdDateLabel = quotation.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

  type SummaryRow = { label: string; type: "Required" | "Optional"; feeExclVat: number };
  const summaryRows: SummaryRow[] = [
    { label: "Consultancy Down Payment - Upon Appointment", type: "Required", feeExclVat: downPayment },
    ...quotation.mandatoryFees.map((f) => ({ label: f.name, type: "Required" as const, feeExclVat: f.price })),
    { label: "Consultancy Balance - Upon Building Permit", type: "Required" as const, feeExclVat: balance },
  ];
  const requiredTotal = summaryRows.reduce((sum, r) => sum + r.feeExclVat, 0);
  const optionalRows: SummaryRow[] = quotation.optionalServices.map((f) => ({ label: f.name, type: "Optional" as const, feeExclVat: f.price }));
  const optionalTotal = optionalRows.reduce((sum, r) => sum + r.feeExclVat, 0);

  return (
    <>
      <div className="mt-6 text-center">
        <h1 className="text-xl font-bold text-[var(--sec-ink)]">{quotation.title}</h1>
        {quotation.subtitle && <p className="mt-1 text-sm font-medium text-[var(--sec-blue)]">{quotation.subtitle}</p>}
      </div>

      <table className="mt-6 w-full border-collapse text-sm">
        <tbody>
          {[
            ["Attention", quotation.attention],
            ["Client", quotation.clientName],
            ["Project", quotation.projectDescription],
            ["Location", quotation.location],
          ]
            .filter(([, v]) => v)
            .map(([label, value]) => (
              <tr key={label} className="border border-[var(--sec-line)]">
                <td className="w-48 border border-[var(--sec-line)] bg-slate-50 px-3 py-2 font-semibold">{label}</td>
                <td className="border border-[var(--sec-line)] px-3 py-2">{value}</td>
              </tr>
            ))}
        </tbody>
      </table>

      {quotation.attention && <p className="mt-5 text-sm">Dear {quotation.attention},</p>}
      {linesOf(quotation.intro).map((line, i) => (
        <p key={i} className={`text-sm text-[var(--sec-ink)] ${i === 0 ? "mt-2" : "mt-3"}`}>
          {line}
        </p>
      ))}

      <h2 className="mt-8 text-base font-bold text-[var(--sec-blue)]">1 Scope of Services</h2>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
        {linesOf(quotation.scopeItemsText).map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ol>
      <p className="mt-3 text-sm font-bold">
        Professional Consultancy Fee: AED {money(scopeFee)} + {quotation.vatRatePercent}% VAT = AED {money(scopeFee * (1 + vat))} including VAT.
      </p>

      <h2 className="mt-8 text-base font-bold text-[var(--sec-blue)]">2 Mandatory Authority Fees</h2>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
        {quotation.mandatoryFees.map((f, i) => (
          <li key={i}>
            {f.name}: AED {money(f.price)} + VAT{f.note ? `, ${f.note}` : ""}.
          </li>
        ))}
      </ol>

      <h2 className="mt-8 break-inside-avoid text-base font-bold text-[var(--sec-blue)]">3 Exclusions and Limitations</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {linesOf(quotation.exclusionsText).map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>

      {quotation.optionalServices.length > 0 && (
        <>
          <h2 className="mt-8 break-inside-avoid text-base font-bold text-[var(--sec-blue)]">4 Optional Additional Services If Required</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
            {quotation.optionalServices.map((f, i) => (
              <li key={i}>
                {f.name}: AED {money(f.price)} + VAT{f.note ? `, ${f.note}` : ""}.
              </li>
            ))}
          </ol>
        </>
      )}

      <h2 className="mt-8 break-inside-avoid text-base font-bold text-[var(--sec-blue)]">5 Commercial Terms</h2>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
        {linesOf(quotation.commercialConditions).map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ol>

      <h2 className="mt-8 text-base font-bold text-[var(--sec-blue)]">6 Commercial Summary and Payment Schedule</h2>
      <table className="mt-2 w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[var(--sec-blue-deep)] text-white">
            <th className="border border-[var(--sec-blue-deep)] px-2 py-2 text-left">No.</th>
            <th className="border border-[var(--sec-blue-deep)] px-2 py-2 text-left">Service and Payment Trigger</th>
            <th className="border border-[var(--sec-blue-deep)] px-2 py-2 text-left">Type</th>
            <th className="border border-[var(--sec-blue-deep)] px-2 py-2 text-right">Fee Excl. VAT</th>
            <th className="border border-[var(--sec-blue-deep)] px-2 py-2 text-right">Total Incl. VAT</th>
          </tr>
        </thead>
        <tbody>
          {summaryRows.map((row, i) => (
            <tr key={i}>
              <td className="border border-[var(--sec-line)] px-2 py-1.5">{i + 1}</td>
              <td className="border border-[var(--sec-line)] px-2 py-1.5">{row.label}</td>
              <td className="border border-[var(--sec-line)] px-2 py-1.5">{row.type}</td>
              <td className="border border-[var(--sec-line)] px-2 py-1.5 text-right">AED {money(row.feeExclVat)}</td>
              <td className="border border-[var(--sec-line)] px-2 py-1.5 text-right">AED {money(row.feeExclVat * (1 + vat))}</td>
            </tr>
          ))}
          <tr className="font-bold">
            <td className="border border-[var(--sec-line)] px-2 py-1.5" colSpan={3}>
              Total Required Payments
            </td>
            <td className="border border-[var(--sec-line)] px-2 py-1.5 text-right">AED {money(requiredTotal)}</td>
            <td className="border border-[var(--sec-line)] px-2 py-1.5 text-right">AED {money(requiredTotal * (1 + vat))}</td>
          </tr>
          {optionalRows.map((row, i) => (
            <tr key={i}>
              <td className="border border-[var(--sec-line)] px-2 py-1.5">{summaryRows.length + i + 1}</td>
              <td className="border border-[var(--sec-line)] px-2 py-1.5">{row.label}</td>
              <td className="border border-[var(--sec-line)] px-2 py-1.5">{row.type}</td>
              <td className="border border-[var(--sec-line)] px-2 py-1.5 text-right">AED {money(row.feeExclVat)}</td>
              <td className="border border-[var(--sec-line)] px-2 py-1.5 text-right">AED {money(row.feeExclVat * (1 + vat))}</td>
            </tr>
          ))}
          {optionalRows.length > 0 && (
            <>
              <tr className="font-bold">
                <td className="border border-[var(--sec-line)] px-2 py-1.5" colSpan={3}>
                  Total Optional Services
                </td>
                <td className="border border-[var(--sec-line)] px-2 py-1.5 text-right">AED {money(optionalTotal)}</td>
                <td className="border border-[var(--sec-line)] px-2 py-1.5 text-right">AED {money(optionalTotal * (1 + vat))}</td>
              </tr>
              <tr className="font-bold">
                <td className="border border-[var(--sec-line)] px-2 py-1.5" colSpan={3}>
                  Potential Total Including All Optional Services
                </td>
                <td className="border border-[var(--sec-line)] px-2 py-1.5 text-right">AED {money(requiredTotal + optionalTotal)}</td>
                <td className="border border-[var(--sec-line)] px-2 py-1.5 text-right">AED {money((requiredTotal + optionalTotal) * (1 + vat))}</td>
              </tr>
            </>
          )}
        </tbody>
      </table>
      <p className="mt-2 text-xs italic text-[var(--sec-muted)]">
        Optional services apply only upon the Client&apos;s written instruction. No site supervision or site visit is included in this quotation.
      </p>

      <h2 className="mt-8 break-inside-avoid text-base font-bold text-[var(--sec-blue)]">Bank Account and Client Acceptance</h2>
      {quotation.acceptanceNote && <p className="mt-1 text-sm">{quotation.acceptanceNote}</p>}

      <p className="mt-4 text-sm font-bold underline">Bank Account Details</p>
      <div className="text-sm">
        <p>Account Name: {BANK_DETAILS.accountName}</p>
        <p>Bank Name: {BANK_DETAILS.bankName}</p>
        <p>Account Number: {BANK_DETAILS.accountNumber}</p>
        <p>IBAN: {BANK_DETAILS.iban}</p>
        <p>Currency: {BANK_DETAILS.currency}</p>
      </div>

      <div className="mt-6 text-sm">
        <p className="text-base font-bold">Client Confirmation</p>
        <p className="mt-1">
          We hereby confirm our acceptance of this quotation, including its scope, exclusions, commercial terms, authority fees,
          optional services, and payment schedule.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-8 text-sm sm:grid-cols-2">
        <div>
          <p className="bg-slate-100 px-2 py-1.5 font-semibold">For SOLID Engineering Consultancy</p>
          <div className="mt-4 space-y-4">
            <p>Authorized Signatory: {quotation.signatoryName || "Eng. Mohammad Abu Eisa"}</p>
            <p>
              Signature and Stamp: <Blank />
              {quotation.showStamp && <img src="/images/stamp.png" alt="Company stamp" className="mt-2 h-20 object-contain" />}
            </p>
            <p>Date: {createdDateLabel}</p>
          </div>
        </div>
        <div>
          <p className="bg-slate-100 px-2 py-1.5 font-semibold">For {quotation.clientName || "Client"}</p>
          <div className="mt-4 space-y-4">
            <p>
              Authorized Name: <Blank />
            </p>
            <p>
              Designation: <Blank />
            </p>
            <p>
              Signature and Stamp: <Blank />
            </p>
            <p>
              Date: <Blank width="w-32" />
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
