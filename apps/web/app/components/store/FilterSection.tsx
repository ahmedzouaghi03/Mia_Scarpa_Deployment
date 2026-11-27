"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

type FilterSectionProps = {
  title: string;
  hint?: string;
  /** Shown next to the title on mobile only — e.g. the active choice while collapsed. */
  mobileHint?: string;
  children: React.ReactNode;
};

/**
 * Shop filter section. Below `lg` the header is a toggle and the content starts collapsed,
 * so a long category list doesn't take over the phone screen. From `lg` up it is always
 * open and looks exactly like a plain section.
 */
export function FilterSection({ title, hint, mobileHint, children }: FilterSectionProps) {
  const [open, setOpen] = useState(false);
  const contentId = useId();

  return (
    <div className="border-t border-[var(--color-border)] py-5 first:border-t-0 first:pt-0">
      <h3 className={`lg:mb-3 ${open ? "mb-3" : ""}`}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={contentId}
          className="flex w-full items-baseline justify-between gap-2 text-left lg:pointer-events-none"
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text)]">
            {title}
          </span>
          <span className="flex min-w-0 items-center gap-2">
            {hint && <span className="truncate text-[11px] text-[var(--color-muted)]">{hint}</span>}
            {!hint && mobileHint && (
              <span className="truncate text-[11px] text-[var(--color-muted)] lg:hidden">{mobileHint}</span>
            )}
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 self-center text-[var(--color-muted)] transition-transform lg:hidden ${
                open ? "rotate-180" : ""
              }`}
            />
          </span>
        </button>
      </h3>
      <div id={contentId} className={open ? "" : "hidden lg:block"}>
        {children}
      </div>
    </div>
  );
}
