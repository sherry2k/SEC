import "server-only";
import { readFileSync } from "fs";
import path from "path";
import { COMPANY } from "@/lib/company";

// Puppeteer's header/footer templates render in an isolated context with
// no access to the app's own stylesheet or /public URLs — everything has
// to be inline-styled, self-contained HTML, and images have to be
// embedded directly as data URIs. Read once at module load and reused for
// every PDF generated in this process (a cold start pays this cost once,
// not per request).
function toDataUri(relativePath: string, mime: string): string {
  const bytes = readFileSync(path.join(process.cwd(), "public", "images", "pdf", relativePath));
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

const LOGO_URI = toDataUri("logo.png", "image/png");
const WORDMARK_URI = toDataUri("wordmark.png", "image/png");
const CERTS_URI = toDataUri("certifications.jpg", "image/jpeg");

const FONT_STACK = "Arial, Helvetica, sans-serif";

export function buildHeaderTemplate(opts: { dateLabel: string; dateValue: string; refLabel: string; refValue: string }): string {
  // TEMPORARY diagnostic version — loud colors and a visible border so
  // the header's actual rendered box is unmistakable in the output. This
  // is not the final design; it's here to see exactly what Puppeteer is
  // doing with the margin/header box before guessing at CSS again.
  return `
    <div style="width:100%; height:100%; font-size:14px; padding:4px 10mm; box-sizing:border-box; font-family:${FONT_STACK}; color:#000; background:#ffe600; border:3px solid #d00000;">
      HEADER BOX — SOLID Engineering Consultancy — <b>${opts.dateLabel}:</b> ${opts.dateValue} &nbsp; <b>${opts.refLabel}</b> ${opts.refValue}
    </div>
  `;
}

export function buildFooterTemplate(): string {
  return `
    <div style="width:100%; height:100%; font-size:12px; padding:4px 10mm; box-sizing:border-box; font-family:${FONT_STACK}; color:#000; background:#00e6e6; border:3px solid #0000d0;">
      FOOTER BOX — ${COMPANY.address}, Tel: ${COMPANY.tel}, Mobile: ${COMPANY.mobile}, Email: ${COMPANY.email}
    </div>
  `;
}
