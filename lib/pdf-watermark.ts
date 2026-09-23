import "server-only";
import { readFileSync } from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";

const LOGO_PATH = path.join(process.cwd(), "public", "images", "logo.png");

// Stamps a faint, centered watermark onto every page of an already-
// generated PDF — a genuine post-processing step on the PDF's real
// object structure, not part of the page's own CSS/HTML. This is what
// actually guarantees it shows correctly on every page, page 1 included.
// Three separate CSS-based approaches (position:fixed, absolute
// positioning, removing backgrounds) each hit a different Chrome/
// Puppeteer rendering limitation — the last one confirmed Chrome's PDF
// export can bake page content into an opaque object regardless of what
// the CSS actually says, which no amount of CSS tuning can fix. Working
// on the finished PDF directly sidesteps all of that.
export async function addWatermarkToPdf(pdfBytes: Buffer): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const logoBytes = readFileSync(LOGO_PATH);
  const logoImage = await pdfDoc.embedPng(logoBytes);

  // PDF points (72 per inch) — roughly matches the visual size the CSS
  // versions were aiming for.
  const targetWidth = 280;
  const aspectRatio = logoImage.height / logoImage.width;
  const targetHeight = targetWidth * aspectRatio;

  for (const page of pdfDoc.getPages()) {
    const { width, height } = page.getSize();
    page.drawImage(logoImage, {
      x: (width - targetWidth) / 2,
      y: (height - targetHeight) / 2,
      width: targetWidth,
      height: targetHeight,
      opacity: 0.13,
    });
  }

  const outBytes = await pdfDoc.save();
  return Buffer.from(outBytes);
}
