"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, User, LogOut, Loader2 } from "lucide-react";
import { ROLE_LABELS, type Role } from "@/lib/roles";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function AccountMenu({ name, role }: { name: string; role: Role }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleSignOut = async () => {
    setSigningOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md py-1 pl-1 pr-2 transition-colors hover:bg-slate-100"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--sec-blue)] text-xs font-semibold text-white">
          {initials(name)}
        </span>
        <span className="hidden text-sm font-medium text-[var(--sec-ink)] sm:inline">{name.split(" ")[0]}</span>
        <ChevronDown size={14} className="text-[var(--sec-muted)]" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-lg border border-[var(--sec-line)] bg-white shadow-lg">
          <div className="border-b border-[var(--sec-line)] px-4 py-3">
            <p className="truncate text-sm font-medium text-[var(--sec-ink)]">{name}</p>
            <p className="text-xs text-[var(--sec-muted)]">{ROLE_LABELS[role]}</p>
          </div>
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--sec-ink)] hover:bg-slate-50"
          >
            <User size={15} className="text-[var(--sec-muted)]" />
            Profile
          </Link>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-[var(--sec-ink)] hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            {signingOut ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} className="text-[var(--sec-muted)]" />}
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
