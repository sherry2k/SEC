import localFont from "next/font/local";

// Self-hosted so it's guaranteed to be available in the headless Chromium
// used for server-side PDF generation (@sparticuz/chromium ships a minimal
// build with no Arabic glyphs at all — that's exactly why Arabic text was
// rendering as empty boxes in Download PDF, even though it's fine in the
// browser's own Print dialog, which uses the system's installed fonts).
//
// Used only as the LAST entry in a font-family stack (see the print-source
// page), not applied directly to every element — Latin/English text keeps
// rendering in Arial as before. The browser only falls back to this font
// for Arabic codepoints Arial doesn't cover, which is the normal CSS
// font-family fallback behavior.
export const arabicFont = localFont({
  src: [
    { path: "../fonts/noto-naskh-arabic-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/noto-naskh-arabic-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-arabic",
  display: "swap",
});
