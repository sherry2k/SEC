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
  // Deliberately minimal for now — plain text, one line, no images, no
  // flex layout — to isolate whether the earlier overlap was caused by
  // the design's complexity or by something more fundamental in how
  // margins/templates are being applied. Once this plain version is
  // confirmed working correctly, the fuller branded design goes back in.
  return `
    <div style="width:100%; font-size:14px; padding:0 10mm; box-sizing:border-box; font-family:${FONT_STACK}; color:#101010;">
      SOLID Engineering Consultancy — <b>${opts.dateLabel}:</b> ${opts.dateValue} &nbsp; <b>${opts.refLabel}</b> ${opts.refValue}
    </div>
  `;
}

export function buildFooterTemplate(): string {
  return `
    <div style="width:100%; font-size:12px; padding:0 10mm; box-sizing:border-box; font-family:${FONT_STACK}; color:#555;">
      ${COMPANY.address}, Tel: ${COMPANY.tel}, Mobile: ${COMPANY.mobile}, Email: ${COMPANY.email}
    </div>
  `;
}
