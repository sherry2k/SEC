// A faint, centered logo behind the content on every printed page — uses
// position: fixed rather than being part of the normal content flow,
// which is what makes it repeat correctly on every page a document spans
// (the same CSS mechanism print watermarks conventionally rely on).
// Works for both the browser's native print and Puppeteer's PDF
// generation, since Puppeteer explicitly emulates print media (see
// lib/pdf.ts) — this only ever appears in printed/exported output, never
// on the normal in-app viewing page.
export default function PrintWatermark() {
  return <img src="/images/logo.png" alt="" aria-hidden="true" className="print-watermark hidden print:block" />;
}
