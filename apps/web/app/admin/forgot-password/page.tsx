"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Mail, MailCheck } from "lucide-react";

const inp =
  "w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20";

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      const res = await fetch("/api/auth/forgetPassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, scope: "admin" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSent(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2">
            <span className="rounded-xl bg-[var(--color-green)] px-3 py-1.5 text-lg font-black text-white tracking-wide">
              FLEX
            </span>
            <span className="text-base font-semibold text-[var(--color-text)]">Admin</span>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-bg)] ring-1 ring-[var(--color-border)]">
              {sent ? (
                <MailCheck className="h-5 w-5 text-[var(--color-accent)]" />
              ) : (
                <Mail className="h-5 w-5 text-[var(--color-accent)]" />
              )}
            </div>
          </div>

          <h1 className="mb-2 text-center text-xl font-bold text-[var(--color-text)]">
            {sent ? "Check your inbox" : "Forgot password"}
          </h1>
          <p className="mb-6 text-center text-sm text-[var(--color-muted)]">
            {sent
              ? `If an admin account exists for ${email}, you'll receive a reset link shortly. The link expires in 1 hour.`
              : "Enter your admin email and we'll send you a link to reset your password."}
          </p>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!sent && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[var(--color-text)]">Email</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className={inp}
                />
              </div>

              <button
                type="submit"
                disabled={pending}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--color-green-mid)] disabled:opacity-60 active:scale-95"
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                {pending ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm">
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-1.5 font-semibold text-[var(--color-accent)] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
