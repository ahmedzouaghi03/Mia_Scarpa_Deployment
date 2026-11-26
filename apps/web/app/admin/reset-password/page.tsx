"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, KeyRound, Loader2 } from "lucide-react";

const inp =
  "w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20";

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");

    setPending(true);
    try {
      const res = await fetch("/api/auth/resetPassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/admin/login"), 2500);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-red-700">This reset link is invalid or incomplete.</p>
        <Link
          href="/admin/forgot-password"
          className="text-sm font-semibold text-[var(--color-accent)] hover:underline"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-3 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-[var(--color-accent)]" />
        <p className="text-sm text-[var(--color-text)]">
          Your password has been reset. Redirecting to login…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          {error.toLowerCase().includes("expired") && (
            <>
              {" "}
              <Link href="/admin/forgot-password" className="font-semibold underline">
                Request a new link
              </Link>
            </>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-[var(--color-text)]">New password</label>
        <input
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className={inp}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-[var(--color-text)]">Confirm password</label>
        <input
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
          className={inp}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--color-green-mid)] disabled:opacity-60 active:scale-95"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {pending ? "Saving…" : "Reset password"}
      </button>
    </form>
  );
}

export default function AdminResetPasswordPage() {
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
              <KeyRound className="h-5 w-5 text-[var(--color-accent)]" />
            </div>
          </div>

          <h1 className="mb-6 text-center text-xl font-bold text-[var(--color-text)]">
            Set a new password
          </h1>

          <Suspense fallback={<Loader2 className="mx-auto h-5 w-5 animate-spin" />}>
            <ResetPasswordForm />
          </Suspense>
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
