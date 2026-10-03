import { FileDown } from "lucide-react";

// A plain anchor rather than a fetch+blob button — the PDF API route
// returns Content-Disposition: attachment, so the browser handles the
// download natively with no JS needed and no loading-state plumbing.
export default function DownloadPdfButton({ href, label = "Download PDF" }: { href: string; label?: string }) {
  return (
    <a
      href={href}
      className="no-print flex items-center gap-1.5 rounded-md border border-[var(--sec-line)] px-3 py-1.5 text-xs font-medium text-[var(--sec-ink)] transition-colors hover:border-[var(--sec-blue)]"
    >
      <FileDown size={13} />
      {label}
    </a>
  );
}
