"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, Loader2, Clock } from "lucide-react";
import BrandPanel from "@/components/BrandPanel";

type Notice = { kind: "error" | "pending"; message: string } | null;

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data: { error?: string; code?: string } = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.code === "PENDING") {
          setNotice({
            kind: "pending",
            message: "Your account is waiting for admin approval. You can sign in once it's approved.",
          });
        } else {
          setNotice({ kind: "error", message: data.error || "Username or password is incorrect." });
        }
        setLoading(false);
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setNotice({ kind: "error", message: "Couldn't reach the server. Check your connection and try again." });
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[var(--sec-bg)]">
      <BrandPanel
        eyebrow="Project Dashboard"
        heading="Every approval, permit and certificate, tracked in one place."
        body="Sign in to manage projects, checklists and finance across BOC, CBC, Permit, Work Permit and Contractor work."
      />

      <div className="flex flex-1 items-center justify-center px-6 py-14">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <img src="/images/logo.png" alt="SEC" className="h-8 w-8 object-contain" />
            <span className="font-display text-base text-[var(--sec-ink)]">Solid Engineering Consultancy</span>
          </div>

          <h2 className="font-display text-2xl text-[var(--sec-ink)]">Sign in</h2>
          <p className="mt-1 text-sm text-[var(--sec-muted)]">Use the username your admin set up for you.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {notice?.kind === "error" && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {notice.message}
              </div>
            )}
            {notice?.kind === "pending" && (
              <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <Clock size={18} className="mt-0.5 shrink-0" />
                <span>{notice.message}</span>
              </div>
            )}

            <div>
              <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-[var(--sec-ink)]">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Admin"
                required
                autoComplete="username"
                className="w-full rounded-md border border-[var(--sec-line)] bg-white px-3.5 py-2.5 text-sm text-[var(--sec-ink)] outline-none transition-colors focus:border-[var(--sec-blue)] focus:ring-2 focus:ring-[var(--sec-blue)]/20"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-[var(--sec-ink)]">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-md border border-[var(--sec-line)] bg-white px-3.5 py-2.5 pr-11 text-sm text-[var(--sec-ink)] outline-none transition-colors focus:border-[var(--sec-blue)] focus:ring-2 focus:ring-[var(--sec-blue)]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--sec-muted)] hover:text-[var(--sec-ink)]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-[var(--sec-blue)] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--sec-blue-deep)] disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : (
                <>
                  Sign in
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-sm text-[var(--sec-muted)]">
            New to the dashboard?{" "}
            <Link href="/signup" className="font-medium text-[var(--sec-blue)] hover:underline">
              Request an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
