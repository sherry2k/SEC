import "server-only";
import puppeteer from "puppeteer-core";
import chromiumImport from "@sparticuz/chromium";
import { addWatermarkToPdf } from "@/lib/pdf-watermark";

// @sparticuz/chromium's export shape has varied across versions and can
// come through differently depending on how the bundler resolves ESM vs
// CJS interop — this handles both without needing to know which one
// actually happens at runtime on Vercel.
const chromium: {
  args: string[];
  executablePath: (input?: string) => Promise<string>;
} = (chromiumImport as unknown as { default?: typeof chromium }).default ?? (chromiumImport as unknown as typeof chromium);

export async function generatePdf(opts: {
  url: string;
  cookieHeader: string;
  headerTemplate: string;
  footerTemplate: string;
}): Promise<Buffer> {
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  try {
    const page = await browser.newPage();

    // Forward the visitor's session cookie so the auth-protected
    // print-source page renders normally instead of redirecting to login.
    const targetUrl = new URL(opts.url);
    const cookies = opts.cookieHeader
      .split(";")
      .map((c) => c.trim())
      .filter(Boolean)
      .map((c) => {
        const idx = c.indexOf("=");
        return { name: c.slice(0, idx), value: c.slice(idx + 1), domain: targetUrl.hostname, path: "/" };
      });
    if (cookies.length > 0) {
      await page.setCookie(...cookies);
    }

    await page.goto(opts.url, { waitUntil: "networkidle0" });
    // networkidle0 only guarantees requests finished, not that a @font-face
    // (like the self-hosted Arabic font) has actually finished parsing and
    // is ready to paint — without this, Arabic text can render as boxes on
    // a cold start even though the font file loaded in time.
    await page.evaluate(() => document.fonts.ready);
    await page.emulateMediaType("print");

    const pdfBytes = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: opts.headerTemplate,
      footerTemplate: opts.footerTemplate,
      // bottom was previously trimmed to 20mm to match the footer
      // template's own rendered height as closely as possible — but that
      // left almost no buffer, so ordinary rendering variance (line-height
      // rounding, font metrics) let the last line of page content collide
      // with the footer's cert row/address line. The footer template
      // (buildFooterTemplate) renders at roughly 19mm tall — 26mm leaves a
      // real margin of safety instead of a near-exact match.
      margin: { top: "32mm", bottom: "26mm", left: "18mm", right: "18mm" },
    });

    return await addWatermarkToPdf(Buffer.from(pdfBytes));
  } finally {
    await browser.close();
  }
}
