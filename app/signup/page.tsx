"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import BrandPanel from "@/components/BrandPanel";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), username: username.trim(), password }),
      });
      const data: { error?: string } = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Couldn't create the account. Try again.");
        setLoading(false);
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-md border border-[var(--sec-line)] bg-white px-3.5 py-2.5 text-sm text-[var(--sec-ink)] outline-none transition-colors focus:border-[var(--sec-blue)] focus:ring-2 focus:ring-[var(--sec-blue)]/20";

  return (
    <div className="flex min-h-screen bg-[var(--sec-bg)]">
      <BrandPanel
        eyebrow="Request access"
        heading="One dashboard for projects, approvals and accounts."
        body="An admin reviews every new request and assigns the right role before you can sign in."
      />

      <div className="flex flex-1 items-center justify-center px-6 py-14">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <img src="/images/logo.png" alt="SEC" className="h-8 w-8 object-contain" />
            <span className="font-display text-base text-[var(--sec-ink)]">Solid Engineering Consultancy</span>
          </div>

          {submitted ? (
            <div className="pt-6 text-center">
              <CheckCircle2 size={40} className="mx-auto text-[var(--sec-blue)]" />
              <h2 className="font-display mt-4 text-2xl text-[var(--sec-ink)]">Request sent</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--sec-muted)]">
                An admin needs to approve your account first. Once approved, sign in as{" "}
                <span className="font-medium text-[var(--sec-ink)]">@{username.trim().toLowerCase()}</span>.
              </p>
              <Link
                href="/login"
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-md bg-[var(--sec-blue)] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--sec-blue-deep)]"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-display text-2xl text-[var(--sec-ink)]">Request an account</h2>
              <p className="mt-1 text-sm text-[var(--sec-muted)]">Takes a minute — an admin approves it after.</p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                {error && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-[var(--sec-ink)]">
                    Full name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    required
                    maxLength={100}
                    autoComplete="name"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-[var(--sec-ink)]">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. mohamed"
                    required
                    minLength={3}
                    maxLength={30}
                    autoComplete="username"
                    className={inputClass}
                  />
                  <p className="mt-1.5 text-xs text-[var(--sec-muted)]">
                    Letters, numbers, dots, dashes or underscores.
                  </p>
                </div>

                <div>
                  <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[var(--sec-ink)]">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      required
                      autoComplete="new-password"
                      className={`${inputClass} pr-11`}
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

                <div>
                  <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-[var(--sec-ink)]">
                    Confirm password
                  </label>
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Type it again"
                    required
                    autoComplete="new-password"
                    className={inputClass}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-[var(--sec-blue)] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--sec-blue-deep)] disabled:opacity-50"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : (
                    <>
                      Request account
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-8 text-sm text-[var(--sec-muted)]">
                Already approved?{" "}
                <Link href="/login" className="font-medium text-[var(--sec-blue)] hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
