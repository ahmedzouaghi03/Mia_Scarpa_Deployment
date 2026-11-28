"use client";

import { useState, useTransition } from "react";
import { toast } from "react-hot-toast";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Eye,
  EyeOff,
  Images,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import {
  createHomepageSection,
  deleteHomepageSection,
  reorderHomepageSections,
  updateHomepageSection,
  type AdminHomepageSection,
} from "@/actions/homepageSectionActions";
import type { Gender } from "@/types";
import CroppedImageUploader from "./CroppedImageUploader";
import { HomepageFeaturedPicker } from "./HomepageFeaturedPicker";
import { ImagePickerModal } from "./ImagePickerModal";
import { ConfirmDialog } from "./ConfirmDialog";

type EditorProduct = {
  id: string;
  name: string;
  priceCents: number;
  images: string[];
  isPublished: boolean;
  gender: Gender;
};

const GENDER_LABEL: Record<Gender, string> = { MEN: "Men", WOMEN: "Women", ENFANT: "Kids" };
const GENDERS: Gender[] = ["MEN", "WOMEN", "ENFANT"];
const MAX_PRODUCTS = 8;

export function HomepageCategorySectionsEditor({
  initialSections,
  products,
  imageLibrary,
  fallbackImage,
}: {
  initialSections: AdminHomepageSection[];
  products: EditorProduct[];
  /** Previously uploaded images the admin can reuse. */
  imageLibrary: string[];
  /** The general section's photo — used by any section without its own. */
  fallbackImage: string | null;
}) {
  const [sections, setSections] = useState(initialSections);
  const [newGender, setNewGender] = useState<Gender | "">("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const usedGenders = new Set(sections.map((s) => s.gender));
  const available = GENDERS.filter((g) => !usedGenders.has(g));
  // images uploaded in this session become pickable for the other sections too
  const library = [...new Set([...sections.map((s) => s.image).filter(Boolean) as string[], ...imageLibrary])];

  function patch(id: string, data: Partial<AdminHomepageSection>) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
  }

  function handleAdd() {
    if (!newGender) return;
    startTransition(async () => {
      const res = await createHomepageSection(newGender);
      if (!res.success || !res.data) {
        toast.error(res.error ?? "Failed to add section");
        return;
      }
      setSections((prev) => [...prev, res.data!]);
      setOpenId(res.data.id);
      setNewGender("");
    });
  }

  function handleToggle(section: AdminHomepageSection) {
    const isEnabled = !section.isEnabled;
    patch(section.id, { isEnabled });
    startTransition(async () => {
      const res = await updateHomepageSection(section.id, { isEnabled });
      if (!res.success) {
        patch(section.id, { isEnabled: !isEnabled });
        toast.error(res.error ?? "Failed to save");
      }
    });
  }

  function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const previous = sections;
    const next = [...sections];
    [next[index], next[target]] = [next[target]!, next[index]!];
    setSections(next);
    startTransition(async () => {
      const res = await reorderHomepageSections(next.map((s) => s.id));
      if (!res.success) {
        setSections(previous);
        toast.error(res.error ?? "Failed to reorder");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteHomepageSection(id);
      setDeleteId(null);
      if (!res.success) {
        toast.error(res.error ?? "Failed to delete");
        return;
      }
      setSections((prev) => prev.filter((s) => s.id !== id));
    });
  }

  function handleImage(id: string, image: string | null) {
    startTransition(async () => {
      const res = await updateHomepageSection(id, { image });
      if (res.success) {
        patch(id, { image });
        toast.success(image ? "Photo saved!" : "Photo removed — using the general section photo");
      } else {
        toast.error(res.error ?? "Failed to save photo");
      }
    });
  }

  const deleting = sections.find((s) => s.id === deleteId);

  return (
    <div className="space-y-5">
      {/* add a section */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <select
          value={newGender}
          onChange={(e) => setNewGender(e.target.value as Gender | "")}
          className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 sm:max-w-xs"
        >
          <option value="">
            {available.length ? "Choose a department…" : "Every department already has a section"}
          </option>
          {available.map((g) => (
            <option key={g} value={g}>
              {GENDER_LABEL[g]}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!newGender || pending}
          onClick={handleAdd}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--color-green-mid)] disabled:opacity-50"
        >
          {pending && newGender ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add section
        </button>
      </div>

      {sections.length === 0 && (
        <p className="rounded-xl border-2 border-dashed border-[var(--color-border)] py-8 text-center text-sm text-[var(--color-muted)]">
          No department sections yet. Only the general section is shown on the homepage.
        </p>
      )}

      {/* section list */}
      <div className="space-y-3">
        {sections.map((section, index) => {
          const isOpen = openId === section.id;
          const thumb = section.image ?? fallbackImage;
          // the general section is position 0 (photo left), so shown department sections start
          // on the other side; hidden sections don't take a slot
          const shownBefore = sections.slice(0, index).filter((s) => s.isEnabled).length;
          const side = !section.isEnabled
            ? "Not on homepage"
            : shownBefore % 2 === 0
              ? "Products left · photo right"
              : "Photo left · products right";

          return (
            <div
              key={section.id}
              className={`overflow-hidden rounded-2xl border bg-white ${
                section.isEnabled ? "border-[var(--color-border)]" : "border-dashed border-[var(--color-border)] opacity-80"
              }`}
            >
              {/* card header */}
              <div className="flex flex-wrap items-center gap-2 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : section.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]">
                    {thumb && (
                      <img
                        src={thumb}
                        alt=""
                        className={`h-full w-full object-cover ${section.image ? "" : "opacity-50"}`}
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[var(--color-text)]">{GENDER_LABEL[section.gender]}</p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {section.productIds.length > 0
                        ? `${section.productIds.length} product${section.productIds.length === 1 ? "" : "s"}`
                        : `Auto: first 4 ${GENDER_LABEL[section.gender]} products`}{" "}
                      · {side}
                    </p>
                  </div>
                  <ChevronDown
                    className={`ml-auto h-4 w-4 shrink-0 text-[var(--color-muted)] transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => handleToggle(section)}
                    title={section.isEnabled ? "Shown — click to hide" : "Hidden — click to show"}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-40 ${
                      section.isEnabled ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {section.isEnabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    {section.isEnabled ? "Shown" : "Hidden"}
                  </button>
                  <button
                    type="button"
                    disabled={pending || index === 0}
                    onClick={() => handleMove(index, -1)}
                    title="Move up"
                    className="rounded-lg p-1.5 text-[var(--color-muted)] transition hover:bg-[var(--color-bg)] hover:text-[var(--color-text)] disabled:opacity-30"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={pending || index === sections.length - 1}
                    onClick={() => handleMove(index, 1)}
                    title="Move down"
                    className="rounded-lg p-1.5 text-[var(--color-muted)] transition hover:bg-[var(--color-bg)] hover:text-[var(--color-text)] disabled:opacity-30"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => setDeleteId(section.id)}
                    title="Delete section"
                    className="rounded-lg p-1.5 text-[var(--color-muted)] transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* card body */}
              {isOpen && (
                <SectionBody
                  section={section}
                  products={products}
                  library={library}
                  fallbackImage={fallbackImage}
                  pending={pending}
                  onImage={(url) => handleImage(section.id, url)}
                  onProductsSaved={(ids) => patch(section.id, { productIds: ids })}
                />
              )}
            </div>
          );
        })}
      </div>

      {deleting && (
        <ConfirmDialog
          title="Delete section"
          message={`Remove the "${GENDER_LABEL[deleting.gender]}" section from the homepage? Products are not affected.`}
          isPending={pending}
          onConfirm={() => handleDelete(deleting.id)}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}

function SectionBody({
  section,
  products,
  library,
  fallbackImage,
  pending,
  onImage,
  onProductsSaved,
}: {
  section: AdminHomepageSection;
  products: EditorProduct[];
  library: string[];
  fallbackImage: string | null;
  pending: boolean;
  onImage: (url: string | null) => void;
  onProductsSaved: (ids: string[]) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  // start on "all products" if a saved pick is from another department, so it stays visible
  const [onlyDepartment, setOnlyDepartment] = useState(() =>
    section.productIds.every((id) => {
      const p = products.find((x) => x.id === id);
      return !p || p.gender === section.gender;
    }),
  );
  const pickerProducts = onlyDepartment ? products.filter((p) => p.gender === section.gender) : products;
  const shownImage = section.image ?? fallbackImage;

  return (
    <div className="grid grid-cols-1 gap-6 border-t border-[var(--color-border)] bg-[var(--color-bg)]/40 p-5 lg:grid-cols-[260px_minmax(0,1fr)]">
      {/* photo */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Photo</p>
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
          {shownImage ? (
            <img src={shownImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-center text-xs text-[var(--color-muted)]">
              No photo yet
            </div>
          )}
          {!section.image && shownImage && (
            <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold text-white">
              Using the general section photo
            </span>
          )}
          {pending && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent)]" />
            </div>
          )}
        </div>

        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <CroppedImageUploader
              endpoint="storeImage"
              aspect={1}
              buttonText={section.image ? "Upload new photo" : "Upload photo"}
              handleUploadComplete={(res) => {
                const url = res[0]?.ufsUrl;
                if (url) onImage(url);
              }}
            />
          </div>
          <button
            type="button"
            disabled={pending || library.length === 0}
            onClick={() => setPickerOpen(true)}
            title="Choose from uploaded images"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--color-text)] transition hover:bg-[var(--color-bg)] disabled:opacity-40"
          >
            <Images className="h-3.5 w-3.5" />
            Choose
          </button>
        </div>

        {section.image && (
          <button
            type="button"
            disabled={pending}
            onClick={() => onImage(null)}
            className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-40"
          >
            Remove photo (use the general section photo)
          </button>
        )}

        {pickerOpen && (
          <ImagePickerModal
            images={library}
            alreadySelected={section.image ? [section.image] : []}
            mode="single"
            onConfirm={(urls) => {
              if (urls[0]) onImage(urls[0]);
            }}
            onClose={() => setPickerOpen(false)}
          />
        )}
      </div>

      {/* products */}
      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Products</p>
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-[var(--color-text)]">
            <input
              type="checkbox"
              checked={onlyDepartment}
              onChange={(e) => setOnlyDepartment(e.target.checked)}
              className="h-3.5 w-3.5 rounded accent-[var(--color-accent)]"
            />
            Only show {GENDER_LABEL[section.gender]} products
          </label>
        </div>
        <HomepageFeaturedPicker
          products={pickerProducts}
          initialSelectedIds={section.productIds}
          maxPicks={MAX_PRODUCTS}
          description={`Pick up to ${MAX_PRODUCTS} products (more than 4 becomes a slider). Leave empty to show the first 4 ${GENDER_LABEL[section.gender]} products automatically.`}
          onSave={async (ids) => {
            const res = await updateHomepageSection(section.id, { productIds: ids });
            if (res.success) onProductsSaved(ids);
            return res;
          }}
        />
      </div>
    </div>
  );
}
