// A single, consistent watermark mechanism for every page of a
// Puppeteer-generated PDF — replaces the earlier two-mechanism approach
// (position:fixed for page 2+, a separate absolute copy for page 1),
// which turned out to behave inconsistently rather than working cleanly
// together (page 1 sometimes showed nothing, sometimes an odd partial
// overlap). This instead places one plain, absolutely-positioned copy of
// the logo at the vertical center of every page's content area — a
// single mechanism, no dependence on any fixed-position browser quirk.
//
// The math: A4 is 297mm tall; this app's PDF margins (lib/pdf.ts) are
// 40mm top and 24mm bottom, leaving 233mm of content per page. Copies
// are centered at 233mm intervals, generous at 10 copies (covers up to a
// 10-page document). Needs updating here if those margins ever change.
const PAGE_CONTENT_HEIGHT_MM = 233;
const COPIES = 10;

export default function PrintWatermarkRepeated() {
  return (
    <div className="print-watermark-anchor hidden print:block" aria-hidden="true">
      {Array.from({ length: COPIES }).map((_, i) => (
        <img
          key={i}
          src="/images/logo.png"
          alt=""
          className="print-watermark-copy"
          style={{ top: `${i * PAGE_CONTENT_HEIGHT_MM + PAGE_CONTENT_HEIGHT_MM / 2}mm` }}
        />
      ))}
    </div>
  );
}
