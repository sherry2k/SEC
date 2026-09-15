"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, FolderKanban } from "lucide-react";

type SearchResult = {
  id: string;
  name: string;
  projectCode: string;
  municipalityNo: string | null;
  clientName: string | null;
};

export default function GlobalProjectSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/projects/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data: { results: SearchResult[] } = await res.json();
          setResults(data.results);
        }
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const go = (id: string) => {
    setOpen(false);
    setQuery("");
    router.push(`/projects/${id}`);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sec-muted)]" />
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Find a project…"
        className="w-full rounded-md border border-[var(--sec-line)] bg-white py-1.5 pl-8 pr-3 text-sm text-[var(--sec-ink)] outline-none focus:border-[var(--sec-blue)] focus:ring-2 focus:ring-[var(--sec-blue)]/20"
      />

      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 top-full z-50 mt-1 w-80 max-w-[90vw] overflow-hidden rounded-lg border border-[var(--sec-line)] bg-white shadow-lg">
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-4 text-sm text-[var(--sec-muted)]">
              <Loader2 size={14} className="animate-spin" />
              Searching…
            </div>
          ) : results.length === 0 ? (
            <p className="px-4 py-4 text-center text-sm text-[var(--sec-muted)]">No projects match "{query}".</p>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {results.map((r) => (
                <button
                  key={r.id}
                  onClick={() => go(r.id)}
                  className="flex w-full items-start gap-2.5 border-b border-[var(--sec-line)] px-4 py-2.5 text-left last:border-0 hover:bg-slate-50"
                >
                  <FolderKanban size={15} className="mt-0.5 shrink-0 text-[var(--sec-muted)]" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--sec-ink)]">{r.name}</p>
                    <p className="truncate text-xs text-[var(--sec-muted)]">
                      {r.municipalityNo || r.projectCode}
                      {r.clientName ? ` · ${r.clientName}` : ""}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
