import Link from "next/link";
import { X } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { CategoryNode } from "@/types";
import type { ShopFacets } from "@/actions/productActions";
import { PriceRangeSlider } from "./PriceRangeSlider";
import { FilterSection } from "./FilterSection";

type Current = {
  category?: string;
  gender?: string;
  promo?: string;
  search?: string;
  size?: string;
  color?: string;
  minPrice?: string;
  maxPrice?: string;
};

type ShopFiltersProps = {
  categories: CategoryNode[];
  facets: ShopFacets;
  current: Current;
};

function buildShopUrl(params: Record<string, string | undefined>) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) q.set(k, v);
  });
  const s = q.toString();
  return s ? `/shop?${s}` : "/shop";
}

export async function ShopFilters({ categories, facets, current }: ShopFiltersProps) {
  const t = await getTranslations("Shop");

  const hrefWith = (overrides: Partial<Current>) =>
    buildShopUrl({ ...current, ...overrides } as Record<string, string | undefined>);

  const rowClass = (active: boolean) =>
    [
      "block rounded-md px-3 py-1.5 text-sm transition",
      active
        ? "bg-[var(--color-text)] font-semibold text-white"
        : "text-[var(--color-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]",
    ].join(" ");

  const activeSizes = current.size
    ? current.size.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const activeColors = current.color
    ? current.color.split(",").map((c) => c.trim()).filter(Boolean)
    : [];
  const isColorActive = (name: string) =>
    activeColors.some((c) => c.toLowerCase() === name.toLowerCase());

  const priceMinValue = current.minPrice ? Number(current.minPrice) : undefined;
  const priceMaxValue = current.maxPrice ? Number(current.maxPrice) : undefined;

  const promoActive = current.promo === "1" || current.promo === "true";

  // shown beside the collapsed section titles on mobile so the active choice stays visible
  const activeGenderLabel =
    current.gender === "men"
      ? t("Men")
      : current.gender === "women"
        ? t("Women")
        : current.gender === "enfant"
          ? t("Enfant")
          : undefined;
  const activeCategoryName = current.category
    ? categories
        .flatMap((c) => [c, ...c.children])
        .find((c) => c.slug === current.category)?.name
    : undefined;

  const hasActiveFilters = Boolean(
    current.category ||
      current.search ||
      current.size ||
      current.color ||
      current.minPrice ||
      current.maxPrice ||
      promoActive,
  );

  const Section = ({
    title,
    hint,
    children,
  }: {
    title: string;
    hint?: string;
    children: React.ReactNode;
  }) => (
    <div className="border-t border-[var(--color-border)] py-5 first:border-t-0 first:pt-0">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text)]">
          {title}
        </h3>
        {hint && <span className="text-[11px] text-[var(--color-muted)]">{hint}</span>}
      </div>
      {children}
    </div>
  );

  return (
    <aside className="text-sm">
      <div className="flex items-center justify-between pb-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text)]">
          {t("FiltersTitle")}
        </h2>
        {hasActiveFilters && (
          <Link
            href={hrefWith({
              category: undefined,
              promo: undefined,
              search: undefined,
              size: undefined,
              color: undefined,
              minPrice: undefined,
              maxPrice: undefined,
            })}
            scroll={false}
            className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
          >
            <X className="h-3 w-3" />
            {t("ClearFilters")}
          </Link>
        )}
      </div>

      {current.search && (
        <Section title={t("Search")}>
          <Link
            href={hrefWith({ search: undefined })}
            scroll={false}
            className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm text-[var(--color-text)] transition hover:border-[var(--color-text)]"
          >
            <span className="truncate">&ldquo;{current.search}&rdquo;</span>
            <X className="h-3.5 w-3.5 shrink-0" />
          </Link>
        </Section>
      )}

      <FilterSection title={t("Promotions")} mobileHint={promoActive ? t("OnSaleOnly") : undefined}>
        <Link
          href={hrefWith({ promo: promoActive ? undefined : "1" })}
          scroll={false}
          className={`flex items-center justify-between rounded-md px-3 py-1.5 text-sm font-semibold transition ${
            promoActive
              ? "bg-[var(--color-promo)] text-white"
              : "text-[var(--color-promo)] hover:bg-[var(--color-promo)]/10"
          }`}
        >
          {t("OnSaleOnly")}
          {promoActive && <X className="h-3.5 w-3.5" />}
        </Link>
      </FilterSection>

      <FilterSection title={t("Gender")} mobileHint={activeGenderLabel}>
        <div className="space-y-0.5">
          {[
            { key: undefined as string | undefined, label: t("All") },
            { key: "men", label: t("Men") },
            { key: "women", label: t("Women") },
            { key: "enfant", label: t("Enfant") },
          ].map(({ key, label }) => (
            <Link
              key={label}
              href={hrefWith({ gender: key, category: undefined })}
              scroll={false}
              className={rowClass((current.gender ?? undefined) === key)}
            >
              {label}
            </Link>
          ))}
        </div>
      </FilterSection>

      <FilterSection title={t("Category")} mobileHint={activeCategoryName}>
        <div className="space-y-0.5">
          <Link href={hrefWith({ category: undefined })} scroll={false} className={rowClass(!current.category)}>
            {t("AllCategories")}
          </Link>
          {categories.map((c) => (
            <div key={c.id}>
              <Link
                href={hrefWith({ category: c.slug })}
                scroll={false}
                className={rowClass(current.category === c.slug)}
              >
                {c.name}
              </Link>
              {c.children.length > 0 && (
                <div className="ml-3 space-y-0.5 border-l border-[var(--color-border)] pl-2">
                  {c.children.map((child) => (
                    <Link
                      key={child.id}
                      href={hrefWith({ category: child.slug })}
                      scroll={false}
                      className={`${rowClass(current.category === child.slug)} text-[13px]`}
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </FilterSection>

      {facets.priceMax > facets.priceMin && (
        <FilterSection title={t("Price")}>
          <PriceRangeSlider
            min={facets.priceMin}
            max={facets.priceMax}
            valueMin={priceMinValue}
            valueMax={priceMaxValue}
          />
        </FilterSection>
      )}

      {facets.sizes.length > 0 && (
        <FilterSection
          title={t("Size")}
          hint={activeSizes.length > 0 ? `${activeSizes.length} ${t("Selected")}` : undefined}
        >
          <div className="grid grid-cols-4 gap-1.5">
            {facets.sizes.map((size) => {
              const active = activeSizes.includes(size);
              const next = active
                ? activeSizes.filter((s) => s !== size)
                : [...activeSizes, size];
              return (
                <Link
                  key={size}
                  href={hrefWith({ size: next.length ? next.join(",") : undefined })}
                  scroll={false}
                  className={`flex h-9 items-center justify-center border text-xs font-semibold transition ${
                    active
                      ? "border-[var(--color-text)] bg-[var(--color-text)] text-white"
                      : "border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-text)] hover:text-[var(--color-text)]"
                  }`}
                >
                  {size}
                </Link>
              );
            })}
          </div>
        </FilterSection>
      )}

      {facets.colors.length > 0 && (
        <FilterSection
          title={t("Color")}
          hint={
            activeColors.length === 1
              ? activeColors[0]
              : activeColors.length > 1
                ? `${activeColors.length} ${t("Selected")}`
                : undefined
          }
        >
          <div className="flex flex-wrap gap-2">
            {facets.colors.map((c) => {
              const active = isColorActive(c.name);
              const next = active
                ? activeColors.filter((name) => name.toLowerCase() !== c.name.toLowerCase())
                : [...activeColors, c.name];
              return (
                <Link
                  key={c.name}
                  href={hrefWith({ color: next.length ? next.join(",") : undefined })}
                  scroll={false}
                  title={c.name}
                  aria-label={c.name}
                  className={`flex h-7 w-7 items-center justify-center rounded-full border transition ${
                    active
                      ? "border-[var(--color-text)] ring-2 ring-[var(--color-text)] ring-offset-1"
                      : "border-[var(--color-border)] hover:border-[var(--color-text)]"
                  }`}
                >
                  <span
                    className="h-4 w-4 rounded-full border border-black/10"
                    style={{ backgroundColor: c.hex ?? "transparent" }}
                  />
                </Link>
              );
            })}
          </div>
        </FilterSection>
      )}
    </aside>
  );
}
