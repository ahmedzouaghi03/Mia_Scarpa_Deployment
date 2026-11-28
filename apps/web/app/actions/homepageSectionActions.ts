"use server";

import { revalidatePath } from "next/cache";
import { db } from "@shoestore/db";
import { getCurrentUser } from "@/lib/session";
import { getProductsByIds } from "@/actions/productActions";
import type { ActionResult, Gender, SerializedProduct } from "@/types";

// Per-department (Men / Women / Kids) "photo + products" rows on the homepage, below
// the general featured section. The general section itself stays in StoreSettings
// and always shows.

const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);
const GENDERS: Gender[] = ["MEN", "WOMEN", "ENFANT"];
const MAX_PRODUCTS = 8;
/** How many products to show from the department when the admin hasn't picked any. */
const DEFAULT_COUNT = 4;

async function requireAdmin(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user || !ADMIN_ROLES.has(user.role)) return "Unauthorized";
  return null;
}

async function getStoreId(): Promise<string> {
  const existing = await db.storeSettings.findFirst({ orderBy: { id: "asc" }, select: { id: true } });
  if (existing) return existing.id;
  const created = await db.storeSettings.create({ data: {}, select: { id: true } });
  return created.id;
}

function revalidate() {
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export type AdminHomepageSection = {
  id: string;
  gender: Gender;
  image: string | null;
  productIds: string[];
  isEnabled: boolean;
  order: number;
};

const ADMIN_SELECT = {
  id: true,
  gender: true,
  image: true,
  productIds: true,
  isEnabled: true,
  order: true,
} as const;

export async function getAdminHomepageSections(): Promise<ActionResult<AdminHomepageSection[]>> {
  try {
    const rows = await db.homepageCategorySection.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      select: ADMIN_SELECT,
    });
    return { success: true, data: rows };
  } catch (error) {
    console.error("[HOMEPAGE SECTIONS] admin list error:", error);
    return { success: false, error: "Failed to load sections" };
  }
}

export async function createHomepageSection(
  gender: Gender,
): Promise<ActionResult<AdminHomepageSection>> {
  const authError = await requireAdmin();
  if (authError) return { success: false, error: authError };
  try {
    if (!GENDERS.includes(gender)) return { success: false, error: "Invalid department" };

    const duplicate = await db.homepageCategorySection.findFirst({ where: { gender } });
    if (duplicate) return { success: false, error: "This department already has a section" };

    const storeId = await getStoreId();
    const last = await db.homepageCategorySection.findFirst({
      where: { storeId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const row = await db.homepageCategorySection.create({
      data: { storeId, gender, order: (last?.order ?? -1) + 1 },
      select: ADMIN_SELECT,
    });
    revalidate();
    return { success: true, data: row };
  } catch (error) {
    console.error("[HOMEPAGE SECTIONS] create error:", error);
    return { success: false, error: "Failed to create section" };
  }
}

export async function updateHomepageSection(
  id: string,
  data: { image?: string | null; productIds?: string[]; isEnabled?: boolean },
): Promise<ActionResult> {
  const authError = await requireAdmin();
  if (authError) return { success: false, error: authError };
  try {
    const productIds = data.productIds
      ? [...new Set(data.productIds)].slice(0, MAX_PRODUCTS)
      : undefined;
    await db.homepageCategorySection.update({
      where: { id },
      data: {
        ...(data.image !== undefined ? { image: data.image } : {}),
        ...(productIds ? { productIds } : {}),
        ...(data.isEnabled !== undefined ? { isEnabled: data.isEnabled } : {}),
      },
    });
    revalidate();
    return { success: true };
  } catch (error) {
    console.error("[HOMEPAGE SECTIONS] update error:", error);
    return { success: false, error: "Failed to save section" };
  }
}

export async function deleteHomepageSection(id: string): Promise<ActionResult> {
  const authError = await requireAdmin();
  if (authError) return { success: false, error: authError };
  try {
    await db.homepageCategorySection.delete({ where: { id } });
    revalidate();
    return { success: true };
  } catch (error) {
    console.error("[HOMEPAGE SECTIONS] delete error:", error);
    return { success: false, error: "Failed to delete section" };
  }
}

/** Persists the display order — `ids` is the full list of section ids, top to bottom. */
export async function reorderHomepageSections(ids: string[]): Promise<ActionResult> {
  const authError = await requireAdmin();
  if (authError) return { success: false, error: authError };
  try {
    await db.$transaction(
      ids.map((id, order) => db.homepageCategorySection.update({ where: { id }, data: { order } })),
    );
    revalidate();
    return { success: true };
  } catch (error) {
    console.error("[HOMEPAGE SECTIONS] reorder error:", error);
    return { success: false, error: "Failed to reorder sections" };
  }
}

// ─── Storefront ───────────────────────────────────────────────────────────────

export type HomepageSection = {
  id: string;
  gender: Gender;
  image: string | null;
  products: SerializedProduct[];
};

/**
 * Enabled sections, in order, ready to render.
 * - Photo: the section's own, else `fallbackImage` (the general section's photo).
 * - Products: the picked ones, else the department's first 4 — same order as the shop
 *   page. Sections that end up with no products are skipped.
 */
export async function getHomepageSections(fallbackImage: string | null): Promise<HomepageSection[]> {
  try {
    const rows = await db.homepageCategorySection.findMany({
      where: { isEnabled: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      select: { id: true, gender: true, image: true, productIds: true },
    });

    const sections = await Promise.all(
      rows.map(async (row): Promise<HomepageSection | null> => {
        let ids = row.productIds;
        if (ids.length === 0) {
          const first = await db.product.findMany({
            where: { isPublished: true, gender: row.gender },
            orderBy: [{ isFeatured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
            take: DEFAULT_COUNT,
            select: { id: true },
          });
          ids = first.map((p) => p.id);
        }
        const products = await getProductsByIds(ids);
        const list = products.success ? (products.data ?? []) : [];
        if (list.length === 0) return null;
        return { id: row.id, gender: row.gender, image: row.image ?? fallbackImage, products: list };
      }),
    );

    return sections.filter((s): s is HomepageSection => s !== null);
  } catch (error) {
    console.error("[HOMEPAGE SECTIONS] storefront list error:", error);
    return [];
  }
}
