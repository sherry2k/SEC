"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, FileText } from "lucide-react";

type ProjectOption = { id: string; label: string; name: string; clientName: string | null };

export default function StatementProjectPicker({ projects }: { projects: ProjectOption[] }) {
  const [query, setQuery] = useState("");

  const filtered = projects.filter((p) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return p.label.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || (p.clientName ?? "").toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sec-muted)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find a project…"
          className="w-full rounded-md border border-[var(--sec-line)] bg-white py-2 pl-9 pr-3 text-sm text-[var(--sec-ink)] outline-none focus:border-[var(--sec-blue)] focus:ring-2 focus:ring-[var(--sec-blue)]/20"
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-[var(--sec-line)] bg-white">
        {filtered.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-[var(--sec-muted)]">No projects match that search.</p>
        ) : (
          <div className="divide-y divide-[var(--sec-line)]">
            {filtered.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}/statement`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--sec-ink)]">{p.name}</p>
                  <p className="font-mono text-xs text-[var(--sec-muted)]">
                    {p.label}
                    {p.clientName ? ` · ${p.clientName}` : ""}
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-[var(--sec-blue)]">
                  <FileText size={13} />
                  View statement
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
