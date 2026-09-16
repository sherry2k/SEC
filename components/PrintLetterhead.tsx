export default function PrintLetterhead({
  dateLabel,
  dateValue,
  refLabel,
  refValue,
}: {
  dateLabel: string;
  dateValue: string;
  refLabel: string;
  refValue: string;
}) {
  return (
    <div className="border-b border-[var(--sec-line)] pb-4">
      <div className="flex items-center gap-3">
        <img src="/images/logo.png" alt="" className="h-14 object-contain" />
        <img src="/images/wordmark.png" alt="Solid Engineering Consultancy" className="h-8 object-contain" />
      </div>
      {/* Date/Ref sit on their own line under the logo row, right-aligned —
          not beside the logo anymore. */}
      <div className="mt-2 text-right text-xs text-[var(--sec-muted)]">
        <p>
          <span className="font-semibold text-[var(--sec-ink)]">{dateLabel}:</span> {dateValue}
        </p>
        <p>
          <span className="font-semibold text-[var(--sec-ink)]">{refLabel}</span> {refValue}
        </p>
      </div>
    </div>
  );
}
