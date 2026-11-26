"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

const inp =
  "w-full border border-[var(--color-border)] bg-transparent px-4 py-4 text-sm text-[var(--color-text)] outline-none transition placeholder:text-xs placeholder:font-semibold placeholder:uppercase placeholder:tracking-[0.15em] placeholder:text-[var(--color-muted)] focus:border-[var(--color-text)]";

const submitBtn =
  "inline-flex w-full items-center justify-center gap-2 border border-[var(--color-text)] bg-[var(--color-text)] px-6 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-transparent hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-60";

export default function ForgotPasswordPage() {
  const t = useTranslations("ForgotPassword");
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
        body: JSON.stringify({ email, scope: "store" }),
      });
      if (!res.ok) {
        setError(t("Error"));
        return;
      }
      setSent(true);
    } catch {
      setError(t("Error"));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-20 space-y-10">
      <div className="text-center space-y-2">
        <h1 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-text)]">
          {sent ? t("SentTitle") : t("Title")}
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          {sent ? t("SentText", { email }) : t("Subtitle")}
        </p>
      </div>

      {!sent && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <input
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("Email")}
            aria-label={t("Email")}
            className={inp}
          />

          <button type="submit" disabled={pending} className={submitBtn}>
            {pending && <Loader2 size={16} className="animate-spin" />}
            {t("Submit")}
          </button>
        </form>
      )}

      <p className="text-center text-sm">
        <Link href="/account/login" className="font-semibold text-[var(--color-accent)] hover:underline">
          {t("BackToLogin")}
        </Link>
      </p>
    </main>
  );
}
