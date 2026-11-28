import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { FeaturedShoes } from "./FeaturedShoes";
import type { HomepageSection } from "@/actions/homepageSectionActions";

const GENDER_PARAM = { MEN: "men", WOMEN: "women", ENFANT: "enfant" } as const;

/**
 * One per-department (Men / Women / Kids) "photo + products" row on the homepage —
 * same layout as the general featured section right below the hero, with the
 * department name on top. `reverse` puts the products on the left and the photo on
 * the right (desktop only; on mobile the photo always comes first), so consecutive
 * rows alternate.
 */
export function HomepageCategorySection({
  section,
  reverse,
  title,
  eyebrow,
  viewAllLabel,
}: {
  section: HomepageSection;
  reverse: boolean;
  title: string;
  eyebrow: string;
  viewAllLabel: string;
}) {
  return (
    <section className="border-t border-[var(--color-border)] bg-white">
      <Reveal className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-6 py-12">
        <div>
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-muted)]">
              {eyebrow}
            </p>
          )}
          <h2 className="font-display mt-1 text-3xl text-[var(--color-text)]">{title}</h2>
        </div>
        <Link
          href={`/shop?gender=${GENDER_PARAM[section.gender]}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--color-text)] transition hover:text-[var(--color-muted)]"
        >
          {viewAllLabel} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </Reveal>

      <div className="grid grid-cols-1 gap-1 lg:grid-cols-2">
        <Reveal className={`lg:h-full ${reverse ? "lg:order-2" : ""}`}>
          <div className="relative aspect-square w-full overflow-hidden bg-[var(--color-bg)] lg:aspect-auto lg:h-full">
            {section.image && (
              <Image
                src={section.image}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            )}
          </div>
        </Reveal>

        <Reveal delay={0.1} className={reverse ? "lg:order-1" : ""}>
          <FeaturedShoes products={section.products} />
        </Reveal>
      </div>
    </section>
  );
}
