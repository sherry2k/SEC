"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Link2, Loader2, X } from "lucide-react";

const DOC_TYPE_OPTIONS = [
  { value: "quotation", label: "Quotation" },
  { value: "tax_invoice", label: "Tax Invoice" },
  { value: "performa_invoice", label: "Performa Invoice" },
  { value: "receipt_voucher", label: "Receipt Voucher" },
  { value: "invoice", label: "Invoice" },
] as const;

type DocOption = { id: string; label: string; linkedProjectLabel: string | null };

export default function LinkExistingDocument({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [docType, setDocType] = useState<string>("quotation");
  const [documents, setDocuments] = useState<DocOption[]>([]);
  const [documentId, setDocumentId] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoadingList(true);
    setDocumentId("");
    setError("");
    fetch(`/api/finance-documents?type=${docType}`)
      .then((res) => res.json())
      .then((data: { results: DocOption[] }) => setDocuments(data.results ?? []))
      .catch(() => setError("Couldn't load documents."))
      .finally(() => setLoadingList(false));
  }, [open, docType]);

  const handleLink = async () => {
    if (!documentId) {
      setError("Choose a document first.");
      return;
    }
    setLinking(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/link-document`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docType, documentId }),
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        setError(data.error || "Couldn't link that document.");
        setLinking(false);
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Couldn't reach the server.");
      setLinking(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="no-print flex items-center gap-1.5 text-sm font-medium text-[var(--sec-blue)] hover:underline"
      >
        <Link2 size={14} />
        Link existing document
      </button>
    );
  }

  return (
    <div className="no-print mt-3 rounded-md border border-[var(--sec-line)] bg-slate-50 p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[var(--sec-ink)]">Link existing document</p>
        <button onClick={() => setOpen(false)} className="rounded p-1 text-[var(--sec-muted)] hover:bg-slate-200" aria-label="Close">
          <X size={14} />
        </button>
      </div>

      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className="rounded-md border border-[var(--sec-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--sec-blue)]"
        >
          {DOC_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <select
          value={documentId}
          onChange={(e) => setDocumentId(e.target.value)}
          disabled={loadingList}
          className="flex-1 rounded-md border border-[var(--sec-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--sec-blue)] disabled:opacity-60"
        >
          <option value="">{loadingList ? "Loading…" : "Choose a document"}</option>
          {documents.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
              {d.linkedProjectLabel ? ` (currently linked to ${d.linkedProjectLabel})` : ""}
            </option>
          ))}
        </select>

        <button
          onClick={handleLink}
          disabled={linking}
          className="flex items-center justify-center gap-1.5 rounded-md bg-[var(--sec-blue)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--sec-blue-deep)] disabled:opacity-50"
        >
          {linking ? <Loader2 size={14} className="animate-spin" /> : "Link"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {documents.length === 0 && !loadingList && (
        <p className="mt-2 text-xs text-[var(--sec-muted)]">No {DOC_TYPE_OPTIONS.find((o) => o.value === docType)?.label.toLowerCase()}s exist yet.</p>
      )}
    </div>
  );
}
