"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

type FooterDepartmentProps = {
  label: string;
  href: string;
  /** The department's category list — collapsed below `lg`, always visible from `lg` up. */
  children?: React.ReactNode;
};

/**
 * Footer department (Men / Women / Kids). The label stays a link to the department page;
 * on mobile a chevron beside it shows/hides the category list so the footer stays short
 * however many categories the admin adds.
 */
export function FooterDepartment({ label, href, children }: FooterDepartmentProps) {
  const [open, setOpen] = useState(false);
  const listId = useId();

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between gap-2">
        <Link
          href={href}
          className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-text)] transition hover:text-[var(--color-muted)]"
        >
          {label}
        </Link>
        {children && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={listId}
            aria-label={label}
            className="-m-1.5 p-1.5 text-[var(--color-muted)] transition hover:text-[var(--color-text)] lg:hidden"
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>
      {children && (
        <div id={listId} className={open ? "" : "hidden lg:block"}>
          {children}
        </div>
      )}
    </div>
  );
}
