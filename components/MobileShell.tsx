"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

// Wraps Sidebar so it can slide in as a drawer on mobile and sit statically
// on desktop. The mobile topbar echoes the sidebar's dark brand color, so
// closing the drawer doesn't drop back to a plain white bar.
export default function MobileShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="no-print flex items-center justify-between bg-[var(--sec-blue-deep)] px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <img src="/images/logo-white.png" alt="" className="h-7 w-7 object-contain" />
          <span className="text-sm font-bold text-white">Solid Engineering</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="rounded-md p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
        >
          <Menu size={22} />
        </button>
      </div>

      {open && (
        <div
          onClick={() => setOpen(false)}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
        />
      )}

      <div
        className={`no-print fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-200 ease-out lg:static lg:z-auto lg:translate-x-0 lg:transition-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setOpen(false)}
          aria-label="Close menu"
          className="absolute right-3 top-3 z-10 rounded-md p-1 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
        >
          <X size={18} />
        </button>
        {children}
      </div>
    </>
  );
}
