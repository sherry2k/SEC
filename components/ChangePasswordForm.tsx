"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const inputClass =
    "w-full rounded-md border border-[var(--sec-line)] bg-white px-3.5 py-2.5 pr-11 text-sm text-[var(--sec-ink)] outline-none transition-colors focus:border-[var(--sec-blue)] focus:ring-2 focus:ring-[var(--sec-blue)]/20";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data: { error?: string } = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Couldn't change your password. Try again.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-sm space-y-5">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="flex gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <span>Password changed. Use the new one next time you sign in.</span>
        </div>
      )}

      <div>
        <label htmlFor="currentPassword" className="mb-1.5 block text-sm font-medium text-[var(--sec-ink)]">
          Current password
        </label>
        <div className="relative">
          <input
            id="currentPassword"
            type={showPasswords ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium text-[var(--sec-ink)]">
          New password
        </label>
        <div className="relative">
          <input
            id="newPassword"
            type={showPasswords ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
            autoComplete="new-password"
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => setShowPasswords((v) => !v)}
            aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--sec-muted)] hover:text-[var(--sec-ink)]"
          >
            {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-[var(--sec-ink)]">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          type={showPasswords ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
          className="w-full rounded-md border border-[var(--sec-line)] bg-white px-3.5 py-2.5 text-sm text-[var(--sec-ink)] outline-none transition-colors focus:border-[var(--sec-blue)] focus:ring-2 focus:ring-[var(--sec-blue)]/20"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-md bg-[var(--sec-blue)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--sec-blue-deep)] disabled:opacity-50"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : "Change password"}
      </button>
    </form>
  );
}
