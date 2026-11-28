import Link from "next/link";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { StoreHeader } from "@/components/store/StoreHeader";
import { NewsletterForm } from "@/components/store/NewsletterForm";
import { FooterDepartment } from "@/components/store/FooterDepartment";
import { RouteProgress } from "@/components/store/RouteProgress";
import { PromoBadgeProvider } from "@/components/store/PromoContext";
import { getCurrentUser } from "@/lib/session";
import { getCategoryTree } from "@/actions/categoryActions";
import { getStoreSettings } from "@/actions/storeSettingsActions";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [tFooter, tNav, user, menTreeResult, womenTreeResult, enfantTreeResult, settingsResult] =
    await Promise.all([
      getTranslations("Footer"),
      getTranslations("Nav"),
      getCurrentUser(),
      getCategoryTree("MEN"),
      getCategoryTree("WOMEN"),
      getCategoryTree("ENFANT"),
      getStoreSettings(),
    ]);

  const promoBadgeImage = settingsResult.success
    ? settingsResult.data?.promoBadgeImage ?? null
    : null;

  const showAccount = !user;
  const departments = [
    {
      label: tNav("Men"),
      href: "/shop?gender=men",
      tree: menTreeResult.success ? (menTreeResult.data ?? []) : [],
    },
    {
      label: tNav("Women"),
      href: "/shop?gender=women",
      tree: womenTreeResult.success ? (womenTreeResult.data ?? []) : [],
    },
    {
      label: tNav("Enfant"),
      href: "/shop?gender=enfant",
      tree: enfantTreeResult.success ? (enfantTreeResult.data ?? []) : [],
    },
  ];

  return (
    <PromoBadgeProvider image={promoBadgeImage}>
      <Suspense fallback={null}>
        <RouteProgress />
      </Suspense>
      <StoreHeader />
      {children}
      <footer className="mt-24 border-t border-[var(--color-border)] bg-[var(--color-bg)]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          {/* lg+: 12-col grid — the Shop column gets half the width so the departments
              can sit side by side instead of stacking into one tall column */}
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-text)]">
                {tFooter("ShopHeading")}
              </p>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <Link href="/shop" className="text-sm text-[var(--color-muted)] transition hover:text-[var(--color-text)]">
                    {tFooter("AllProducts")}
                  </Link>
                </li>
              </ul>

              <div className="lg:grid lg:grid-cols-3 lg:gap-6">
              {departments.map((dept) => (
                <FooterDepartment key={dept.href} label={dept.label} href={dept.href}>
                  {dept.tree.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {dept.tree.map((cat) => (
                        <li key={cat.id}>
                          <Link
                            href={`${dept.href}&category=${cat.slug}`}
                            className="text-sm text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
                          >
                            {cat.name}
                          </Link>
                          {cat.children.length > 0 && (
                            <ul className="mt-2 space-y-2 border-l border-[var(--color-border)] pl-3">
                              {cat.children.map((child) => (
                                <li key={child.id}>
                                  <Link
                                    href={`${dept.href}&category=${child.slug}`}
                                    className="text-xs text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
                                  >
                                    {child.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </FooterDepartment>
              ))}
              </div>
            </div>

            {showAccount && (
              <div className="lg:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-text)]">
                  {tFooter("AccountHeading")}
                </p>
                <ul className="mt-4 space-y-2.5">
                  <li>
                    <Link href="/account" className="text-sm text-[var(--color-muted)] transition hover:text-[var(--color-text)]">
                      {tFooter("MyAccount")}
                    </Link>
                  </li>
                  <li>
                    <Link href="/account/login" className="text-sm text-[var(--color-muted)] transition hover:text-[var(--color-text)]">
                      {tNav("SignIn")}
                    </Link>
                  </li>
                </ul>
              </div>
            )}

            <div
              className={`col-span-2 ${
                showAccount ? "sm:col-span-1 lg:col-span-4" : "sm:col-span-2 lg:col-span-6"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-text)]">
                {tFooter("NewsletterHeading")}
              </p>
              <p className="mt-4 text-sm text-[var(--color-muted)]">{tFooter("NewsletterDesc")}</p>
              <NewsletterForm
                emailPlaceholder={tFooter("NewsletterPlaceholder")}
                phonePlaceholder={tFooter("NewsletterPhonePlaceholder")}
                submitLabel={tFooter("NewsletterSubmit")}
              />
            </div>
          </div>

          <div className="mt-14 border-t border-[var(--color-border)] pt-6 text-center text-xs text-[var(--color-muted)]">
            © {new Date().getFullYear()} Mia Scarpa — {tFooter("Rights")}
          </div>
        </div>
      </footer>
    </PromoBadgeProvider>
  );
}
