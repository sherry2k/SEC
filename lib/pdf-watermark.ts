import "server-only";
import { readFileSync } from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";

const LOGO_PATH = path.join(process.cwd(), "public", "images", "logo.png");

// Stamps a faint, centered watermark onto every page of an already-
// generated PDF — a genuine post-processing step on the PDF's real
// object structure, not part of the page's own CSS/HTML. This is what
// actually guarantees it shows correctly on every page, page 1 included.
//
// Deliberately drawn on TOP of the page's existing content (the default
// for pdf-lib's drawImage), not behind it. Behind was tried and reverted:
// Puppeteer's own PDF export bakes the page's rendered content into an
// opaque object as part of how Chrome exports HTML to PDF, independent of
// this file or of any CSS on the page. Drawing the watermark behind that
// object made it completely invisible — worse than the original,
// otherwise-minor visual overlap with colored elements like a table
// header. On top, faint (13% opacity), is the reliable state.
export async function addWatermarkToPdf(pdfBytes: Buffer): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const logoBytes = readFileSync(LOGO_PATH);
  const logoImage = await pdfDoc.embedPng(logoBytes);

  // PDF points (72 per inch) — roughly matches the visual size the CSS
  // versions were aiming for.
  const targetWidth = 380;
  const aspectRatio = logoImage.height / logoImage.width;
  const targetHeight = targetWidth * aspectRatio;

  for (const page of pdfDoc.getPages()) {
    const { width, height } = page.getSize();
    page.drawImage(logoImage, {
      x: (width - targetWidth) / 2,
      y: (height - targetHeight) / 2,
      width: targetWidth,
      height: targetHeight,
      opacity: 0.08,
    });
  }

  const outBytes = await pdfDoc.save();
  return Buffer.from(outBytes);
}
