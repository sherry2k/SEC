// PrintWatermark (position: fixed) correctly repeats on every page a
// Puppeteer-generated PDF spans — except the very first page, which is a
// real, observed Chromium print quirk, not a positioning mistake. This is
// a separate, absolutely-positioned copy anchored to the top of the
// content instead, specifically covering page 1 — a different mechanism
// that doesn't depend on the same fixed-position behavior at all, so it
// isn't subject to the same quirk.
//
// The vertical offset is computed from this app's exact PDF margins
// (lib/pdf.ts): A4 is 297mm tall; minus the 36mm top and 24mm bottom
// margins leaves 237mm of content per page, so its center sits at
// 118.5mm from the top of the content area. Needs updating here if those
// margins ever change.
export default function PrintWatermarkFirstPage() {
  return <img src="/images/logo.png" alt="" aria-hidden="true" className="print-watermark-page1 hidden print:block" />;
}
