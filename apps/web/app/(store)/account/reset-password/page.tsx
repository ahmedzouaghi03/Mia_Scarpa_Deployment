"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";

const inp =
  "w-full border border-[var(--color-border)] bg-transparent px-4 py-4 text-sm text-[var(--color-text)] outline-none transition placeholder:text-xs placeholder:font-semibold placeholder:uppercase placeholder:tracking-[0.15em] placeholder:text-[var(--color-muted)] focus:border-[var(--color-text)]";

const submitBtn =
  "inline-flex w-full items-center justify-center gap-2 border border-[var(--color-text)] bg-[var(--color-text)] px-6 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-transparent hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-60";

function ResetPasswordForm() {
  const t = useTranslations("ResetPassword");
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) return setError(t("TooShort"));
    if (password !== confirm) return setError(t("Mismatch"));

    setPending(true);
    try {
      const res = await fetch("/api/auth/resetPassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // The API's message ("Invalid or expired reset token") is English-only.
        setError(res.status === 400 && data.error ? t("InvalidLink") : t("Error"));
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/account/login"), 2500);
    } catch {
      setError(t("Error"));
    } finally {
      setPending(false);
    }
  }

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-red-700">{t("InvalidLink")}</p>
        <Link href="/account/forgot-password" className="text-sm font-semibold text-[var(--color-accent)] hover:underline">
          {t("RequestNew")}
        </Link>
      </div>
    );
  }

  if (done) {
    return <p className="border border-[var(--color-border)] px-4 py-3 text-center text-sm text-[var(--color-text)]">{t("Success")}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          {error === t("InvalidLink") && (
            <>
              {" "}
              <Link href="/account/forgot-password" className="font-semibold underline">
                {t("RequestNew")}
              </Link>
            </>
          )}
        </div>
      )}

      <div className="relative">
        <input
          required
          minLength={6}
          type={showPw ? "text" : "password"}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("Password")}
          aria-label={t("Password")}
          className={inp + " pr-11"}
        />
        <button
          type="button"
          onClick={() => setShowPw((v) => !v)}
          aria-label={showPw ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
        >
          {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      <input
        required
        minLength={6}
        type={showPw ? "text" : "password"}
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder={t("Confirm")}
        aria-label={t("Confirm")}
        className={inp}
      />

      <button type="submit" disabled={pending} className={submitBtn}>
        {pending && <Loader2 size={16} className="animate-spin" />}
        {t("Submit")}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  const t = useTranslations("ResetPassword");

  return (
    <main className="mx-auto max-w-md px-6 py-20 space-y-10">
      <div className="text-center space-y-2">
        <h1 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-text)]">{t("Title")}</h1>
        <p className="text-sm text-[var(--color-muted)]">{t("Subtitle")}</p>
      </div>

      <Suspense fallback={<Loader2 size={20} className="mx-auto animate-spin" />}>
        <ResetPasswordForm />
      </Suspense>

      <p className="text-center text-sm">
        <Link href="/account/login" className="font-semibold text-[var(--color-accent)] hover:underline">
          {t("BackToLogin")}
        </Link>
      </p>
    </main>
  );
}
