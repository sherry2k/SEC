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
    <div className="flex items-start justify-between border-b border-[var(--sec-line)] pb-6">
      <div className="flex items-center gap-3">
        <img src="/images/logo.png" alt="" className="h-16 object-contain" />
        <img src="/images/wordmark.png" alt="Solid Engineering Consultancy" className="h-10 object-contain" />
      </div>
      <div className="text-right text-xs text-[var(--sec-muted)]">
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
