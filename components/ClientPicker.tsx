"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Plus } from "lucide-react";

type ClientResult = { id: string; name: string; address: string | null };

// The Client field on the Account Project form — type to search clients
// already added, pick one, or create a new one inline without leaving the
// form. Replaces the old free-text "Client name" input.
export default function ClientPicker({
  clientId,
  clientName,
  onSelect,
}: {
  clientId: string;
  clientName: string;
  onSelect: (client: { id: string; name: string }) => void;
}) {
  const [query, setQuery] = useState(clientName);
  const [results, setResults] = useState<ClientResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Keep the input in sync when a different client is selected elsewhere
  // (e.g. the form is reset, or this is prefilled from a ?clientId= link).
  useEffect(() => {
    setQuery(clientName);
  }, [clientName]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/clients?q=${encodeURIComponent(query.trim())}`);
        const data: { results?: ClientResult[] } = await res.json().catch(() => ({}));
        setResults(data.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(handle);
  }, [query, open]);

  const exactMatch = results.some((r) => r.name.toLowerCase() === query.trim().toLowerCase());

  const handleCreate = async () => {
    const name = query.trim();
    if (!name) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data: { error?: string; client?: { id: string; name: string } } = await res.json().catch(() => ({}));
      if (!res.ok || !data.client) {
        setError(data.error || "Couldn't create that client.");
        setCreating(false);
        return;
      }
      onSelect({ id: data.client.id, name: data.client.name });
      setQuery(data.client.name);
      setOpen(false);
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (clientId) onSelect({ id: "", name: e.target.value }); // typing invalidates the previous selection
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search clients, or type a new name…"
        required
        className="w-full rounded-md border border-[var(--sec-line)] bg-white px-3.5 py-2.5 text-sm text-[var(--sec-ink)] outline-none transition-colors focus:border-[var(--sec-blue)] focus:ring-2 focus:ring-[var(--sec-blue)]/20"
      />

      {open && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-[var(--sec-line)] bg-white shadow-lg">
          {loading ? (
            <div className="flex items-center gap-2 px-3.5 py-3 text-sm text-[var(--sec-muted)]">
              <Loader2 size={14} className="animate-spin" />
              Searching…
            </div>
          ) : (
            <>
              {results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    onSelect({ id: r.id, name: r.name });
                    setQuery(r.name);
                    setOpen(false);
                  }}
                  className={`block w-full border-b border-[var(--sec-line)] px-3.5 py-2.5 text-left text-sm last:border-0 hover:bg-blue-50 ${
                    clientId === r.id ? "bg-blue-50" : ""
                  }`}
                >
                  <p className="font-semibold text-[var(--sec-ink)]">{r.name}</p>
                  {r.address && <p className="mt-0.5 text-xs text-[var(--sec-muted)]">{r.address}</p>}
                </button>
              ))}
              {query.trim() && !exactMatch && (
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex w-full items-center gap-2 bg-slate-50 px-3.5 py-2.5 text-left text-sm font-semibold text-[var(--sec-blue)] hover:bg-blue-50 disabled:opacity-50"
                >
                  {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Add new client &quot;{query.trim()}&quot;
                </button>
              )}
              {!loading && results.length === 0 && !query.trim() && (
                <p className="px-3.5 py-3 text-sm text-[var(--sec-muted)]">Start typing to search clients.</p>
              )}
            </>
          )}
        </div>
      )}

      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      {!clientId && query.trim() && !open && <p className="mt-1.5 text-xs text-amber-600">Pick a client from the list, or add it as new.</p>}
    </div>
  );
}
