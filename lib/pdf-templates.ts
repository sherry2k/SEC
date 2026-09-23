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
  return `
    <div style="width:100%; font-size:16px; padding:0 10mm; box-sizing:border-box; font-family:${FONT_STACK}; color:#101010;">
      <div style="display:flex; align-items:flex-end; justify-content:space-between; gap:16px; padding-bottom:10px; border-bottom:2px solid #e2e2e2;">
        <div style="display:flex; align-items:center; gap:16px;">
          <img src="${LOGO_URI}" style="height:68px; width:auto;" />
          <img src="${WORDMARK_URI}" style="height:42px; width:auto;" />
        </div>
        <div style="text-align:right; font-size:14px; color:#555; line-height:1.5;">
          <div><b>${opts.dateLabel}:</b> ${opts.dateValue}</div>
          <div><b>${opts.refLabel}</b> ${opts.refValue}</div>
        </div>
      </div>
    </div>
  `;
}

export function buildFooterTemplate(): string {
  return `
    <div style="width:100%; font-size:12px; padding:8px 10mm 0; box-sizing:border-box; font-family:${FONT_STACK}; color:#555; text-align:center; border-top:2px solid #e2e2e2;">
      <img src="${CERTS_URI}" style="height:28px; width:auto;" />
      <div style="margin-top:5px;">
        ${COMPANY.address}, Tel: ${COMPANY.tel}, Mobile: ${COMPANY.mobile}, Email: ${COMPANY.email}
      </div>
    </div>
  `;
}
