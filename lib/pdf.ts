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
    await page.emulateMediaType("print");

    const pdfBytes = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: opts.headerTemplate,
      footerTemplate: opts.footerTemplate,
      // Confirmed working with the @page conflict removed — these are
      // standard A4 document margins (roughly matching a normal Word
      // doc's ~2cm-2.5cm), sized to comfortably fit the branded
      // header/footer above and below.
      margin: { top: "40mm", bottom: "24mm", left: "18mm", right: "18mm" },
    });

    return await addWatermarkToPdf(Buffer.from(pdfBytes));
  } finally {
    await browser.close();
  }
}
