"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { LEAD_TIME_PRESETS, leadTimeLabel } from "@/lib/time";
import { MAX_CATALOG_POSITION, MAX_HOME_POSITION, Occasion, OCCASIONS, OCCASION_EMOJI, OCCASION_LABEL_EN, ProductKind } from "@/lib/types";
import ImageManager from "@/components/admin/ImageManager";

/**
 * Admin product management.
 *
 * Lets you add, edit, and delete bouquets with multi-photo upload — no code
 * edits or redeploys needed. Requires MONGODB_URI to actually
 * save anything; until then /api/products serves the read-only mock data
 * in lib/data.ts and this page will tell you so.
 *
 * Auth is a real session (next-auth) — middleware.ts blocks this route for
 * anyone not logged in, and every write API call below relies on the session
 * cookie sent automatically with same-origin requests.
 */

interface AdminProduct {
  _id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  images?: string[];
  available: boolean;
  customizable: boolean;
  cost?: number;
  category?: string;
  featured?: boolean;
  featuredOrder?: number;
  catalogOrder?: number;
  categoryOrder?: number;
  leadTimeMinutes?: number;
  todayPick?: boolean;
  kind?: ProductKind;
  tags?: Occasion[];
  sizeNote?: string;
}

const KIND_LABEL: Record<ProductKind, string> = {
  fresh: "Fresh flowers",
  artificial: "Artificial · long-lasting",
  other: "Khata, flag or other",
};

const PRESET_MINUTES = LEAD_TIME_PRESETS.map((p) => p.minutes);
const LEAD_TIME_MAX_MINUTES = 43200; // 30 days
const UNIT_MINUTES = { minutes: 1, hours: 60, days: 1440 } as const;
type LeadUnit = keyof typeof UNIT_MINUTES;

/** Picks the largest whole unit that exactly represents `totalMinutes`, for the custom input. */
function minutesToBestUnit(totalMinutes: number): { amount: number; unit: LeadUnit } {
  if (totalMinutes <= 0) return { amount: 1, unit: "hours" };
  if (totalMinutes % 1440 === 0) return { amount: totalMinutes / 1440, unit: "days" };
  if (totalMinutes % 60 === 0) return { amount: totalMinutes / 60, unit: "hours" };
  return { amount: totalMinutes, unit: "minutes" };
}

const emptyForm = {
  name: "",
  price: "",
  description: "",
  images: [] as string[],
  available: true,
  customizable: false,
  cost: "",
  category: "Bouquets",
  featured: false,
  featuredOrder: 0,
  catalogOrder: 0,
  categoryOrder: 0,
  leadTimeMinutes: "0", // minimum notice in minutes; "0" = none
  todayPick: false,
  kind: "" as ProductKind | "", // "" = not set
  tags: [] as Occasion[],
  sizeNote: "",
};

export default function AdminProductsPage() {
  const router = useRouter();
  const { status: authStatus } = useSession();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [source, setSource] = useState<"mock" | "database" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [customLead, setCustomLead] = useState(false);
  const [customAmount, setCustomAmount] = useState("1");
  const [customUnit, setCustomUnit] = useState<LeadUnit>("hours");
  const [toggling, setToggling] = useState<Record<string, boolean>>({});

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterUnsorted, setFilterUnsorted] = useState(false);

  useEffect(() => {
    // Middleware already blocks unauthenticated requests to this route,
    // this is just for a clean loading/redirect state client-side.
    if (authStatus === "unauthenticated") {
      router.push("/admin/login");
      return;
    }
    if (authStatus === "authenticated") loadProducts();
  }, [authStatus, router]);

  async function loadProducts() {
    setLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories"),
      ]);
      const productsData = await productsRes.json();
      const categoriesData = await categoriesRes.json();
      setProducts(productsData.products || []);
      setCategories(categoriesData.categories || ["Bouquets"]);
      setSource(productsData.source || null);
    } catch {
      setError("Could not load products.");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(p: AdminProduct) {
    setEditingId(p._id);
    setForm({
      name: p.name,
      price: String(p.price),
      description: p.description,
      images: p.images && p.images.length > 0 ? p.images : p.image ? [p.image] : [],
      available: p.available,
      customizable: p.customizable,
      cost: p.cost ? String(p.cost) : "",
      category: p.category || "Bouquets",
      featured: p.featured ?? false,
      featuredOrder: p.featuredOrder ?? 0,
      catalogOrder: p.catalogOrder ?? 0,
      categoryOrder: p.categoryOrder ?? 0,
      leadTimeMinutes: String(p.leadTimeMinutes ?? 0),
      todayPick: p.todayPick ?? false,
      kind: p.kind ?? "",
      tags: p.tags ?? [],
      sizeNote: p.sizeNote ?? "",
    });
    const best = minutesToBestUnit(p.leadTimeMinutes ?? 0);
    setCustomAmount(String(best.amount));
    setCustomUnit(best.unit);
    setCustomLead(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setCustomLead(false);
    setCustomAmount("1");
    setCustomUnit("hours");
    setFormError(null);
  }

  function toggleTag(o: Occasion) {
    setForm((f) => ({ ...f, tags: f.tags.includes(o) ? f.tags.filter((x) => x !== o) : [...f.tags, o] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim()) return setFormError("Name is required.");
    const price = Number(form.price);
    if (!price || price <= 0) return setFormError("Enter a valid price.");

    const leadMinutes = Number(form.leadTimeMinutes);
    if (!Number.isInteger(leadMinutes) || leadMinutes < 0 || leadMinutes > LEAD_TIME_MAX_MINUTES) {
      return setFormError("Order-before time must be a whole number of minutes (0–43200, i.e. up to 30 days).");
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      price,
      description: form.description.trim(),
      image: form.images[0] || "", // cover = first slider photo
      images: form.images,
      available: form.available,
      customizable: form.customizable,
      cost: form.cost ? Number(form.cost) : 0,
      category: form.category.trim() || "Bouquets",
      featured: form.featuredOrder > 0,
      featuredOrder: form.featuredOrder,
      catalogOrder: form.catalogOrder,
      categoryOrder: form.categoryOrder,
      leadTimeMinutes: leadMinutes,
      todayPick: form.todayPick,
      kind: form.kind,
      tags: form.tags,
      sizeNote: form.sizeNote.trim(),
    };

    try {
      const url = editingId ? `/api/products/${editingId}` : "/api/products";
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save product.");

      cancelEdit();
      loadProducts();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save product.");
    } finally {
      setSaving(false);
    }
  }

  // One-tap availability switch. The shop pages read the database on every visit,
  // so the change shows on the catalog straight away — no redeploy.
  async function handleToggleAvailable(p: AdminProduct) {
    const next = !p.available;
    setToggling((t) => ({ ...t, [p._id]: true }));
    setProducts((prev) => prev.map((x) => (x._id === p._id ? { ...x, available: next } : x)));
    try {
      const res = await fetch(`/api/products/${p._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setProducts((prev) => prev.map((x) => (x._id === p._id ? { ...x, available: !next } : x)));
      alert("Could not change availability — try again.");
    } finally {
      setToggling((t) => ({ ...t, [p._id]: false }));
    }
  }

  // One-tap "Best sellers" switch — shown in the first product row on the
  // homepage, takes effect immediately.
  async function handleToggleTodayPick(p: AdminProduct) {
    const next = !p.todayPick;
    setToggling((t) => ({ ...t, [`pick-${p._id}`]: true }));
    setProducts((prev) => prev.map((x) => (x._id === p._id ? { ...x, todayPick: next } : x)));
    try {
      const res = await fetch(`/api/products/${p._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ todayPick: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setProducts((prev) => prev.map((x) => (x._id === p._id ? { ...x, todayPick: !next } : x)));
      alert("Could not change Best sellers — try again.");
    } finally {
      setToggling((t) => ({ ...t, [`pick-${p._id}`]: false }));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product? This can't be undone.")) return;

    const res = await fetch(`/api/products/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      loadProducts();
    } else {
      alert("Could not delete product.");
    }
  }

  const dbNotConnected = source === "mock";
  // A bouquet that still has no type chosen — these need a quick tidy-up.
  const isUnsorted = (p: AdminProduct) => (p.category || "Bouquets") === "Bouquets" && !p.kind;
  const unsortedCount = products.filter(isUnsorted).length;

  // Warn (don't block) when another product already uses the same position number.
  const formCategory = form.category.trim() || "Bouquets";
  const others = products.filter((p) => p._id !== editingId);
  const homeClash = form.featuredOrder > 0 ? others.find((p) => (p.featuredOrder || 0) === form.featuredOrder) : undefined;
  const catalogClash = form.catalogOrder > 0 ? others.find((p) => (p.catalogOrder || 0) === form.catalogOrder) : undefined;
  const categoryClash =
    form.categoryOrder > 0
      ? others.find((p) => (p.category || "Bouquets") === formCategory && (p.categoryOrder || 0) === form.categoryOrder)
      : undefined;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl italic text-charcoal sm:text-3xl">Manage products</h1>
          <p className="mt-1 text-sm text-charcoal/70">Add and manage bouquets, khata, flags, and more.</p>
        </div>
        <button
          onClick={() => router.push("/admin/dashboard")}
          className="self-start text-sm text-charcoal/60 hover:text-rose-dark"
        >
          ← Back to dashboard
        </button>
      </div>

      {dbNotConnected && (
        <div className="mt-4 rounded-card border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Database not connected.</strong> The catalog below is
          read-only mock data from <code>lib/data.ts</code>. Set{" "}
          <code>MONGODB_URI</code> in your environment variables to add,
          edit, or delete products from here.
        </div>
      )}

      {/* Add / edit form */}
      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-card border border-sand bg-white p-6"
      >
        <h2 className="font-display text-xl italic text-charcoal">
          {editingId ? "Edit product" : "Add a new product"}
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">
              Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full rounded-md border border-sand px-3 py-2"
              placeholder="e.g. Red Roses · Black Wrap · Regular"
            />
            <p className="mt-1 text-xs text-charcoal/50">
              Use the same pattern every time: Flower · Wrapping · Size. Check spelling before saving.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">
              Price (Rs.)
            </label>
            <input
              type="number"
              min={1}
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              className="mt-1 w-full rounded-md border border-sand px-3 py-2"
              placeholder="950"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">
              Product Type / Category
            </label>
            <input
              type="text"
              list="categoryList"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="mt-1 w-full rounded-md border border-sand px-3 py-2"
              placeholder="e.g. Bouquets, Khata, Flags"
            />
            <datalist id="categoryList">
              {categories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">
              Fresh or artificial?
            </label>
            <select
              value={form.kind}
              onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as ProductKind | "" }))}
              className="mt-1 w-full rounded-md border border-sand bg-white px-3 py-2"
            >
              <option value="">Not set yet</option>
              <option value="fresh">{KIND_LABEL.fresh}</option>
              <option value="artificial">{KIND_LABEL.artificial}</option>
              <option value="other">{KIND_LABEL.other}</option>
            </select>
            <p className="mt-1 text-xs text-charcoal/50">
              Customers see a badge, and the product is grouped under Fresh or Long-lasting on the homepage.
              Set this for every bouquet so nobody mistakes artificial flowers for fresh ones.
            </p>
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">
              Size note (optional)
            </label>
            <input
              type="text"
              maxLength={60}
              value={form.sizeNote}
              onChange={(e) => setForm((f) => ({ ...f, sizeNote: e.target.value }))}
              className="mt-1 w-full rounded-md border border-sand px-3 py-2"
              placeholder="e.g. 7 roses · about 30 cm"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">
              Good for (occasions)
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {OCCASIONS.map((o) => {
                const on = form.tags.includes(o);
                return (
                  <button
                    key={o}
                    type="button"
                    onClick={() => toggleTag(o)}
                    aria-pressed={on}
                    className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                      on ? "border-charcoal bg-charcoal text-ivory" : "border-sand bg-white text-charcoal hover:border-rose"
                    }`}
                  >
                    {OCCASION_EMOJI[o]} {OCCASION_LABEL_EN[o]}
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-xs text-charcoal/50">
              Pick every occasion that fits. The homepage &quot;Shop by occasion&quot; tiles only appear for
              occasions that have at least one product.
            </p>
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="mt-1 w-full rounded-md border border-sand px-3 py-2"
              rows={2}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">
              Photos (slider)
            </label>
            <ImageManager
              images={form.images}
              onChange={(images) => setForm((f) => ({ ...f, images }))}
              onBusyChange={setUploading}
            />
            <p className="mt-1 text-xs text-charcoal/50">
              Cover photo: whole bouquet, centred, square-friendly, plain background. Then a close-up,
              someone holding it, and a real handover photo if you have one.
            </p>
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">
              Order before (minimum notice)
            </label>
            <select
              value={customLead || !PRESET_MINUTES.includes(Number(form.leadTimeMinutes)) ? "custom" : form.leadTimeMinutes}
              onChange={(e) => {
                if (e.target.value === "custom") {
                  const best = minutesToBestUnit(Number(form.leadTimeMinutes) || 0);
                  setCustomAmount(String(best.amount));
                  setCustomUnit(best.unit);
                  setCustomLead(true);
                } else {
                  setCustomLead(false);
                  setForm((f) => ({ ...f, leadTimeMinutes: e.target.value }));
                }
              }}
              className="mt-1 w-full rounded-md border border-sand bg-white px-3 py-2"
            >
              {LEAD_TIME_PRESETS.map((o) => (
                <option key={o.minutes} value={String(o.minutes)}>
                  {o.label}
                </option>
              ))}
              <option value="custom">Custom (choose the amount)…</option>
            </select>
            {(customLead || !PRESET_MINUTES.includes(Number(form.leadTimeMinutes))) && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={LEAD_TIME_MAX_MINUTES / UNIT_MINUTES[customUnit]}
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    const total = Math.round((Number(e.target.value) || 0) * UNIT_MINUTES[customUnit]);
                    setForm((f) => ({ ...f, leadTimeMinutes: String(total) }));
                  }}
                  className="w-24 rounded-md border border-sand px-3 py-2"
                />
                <select
                  value={customUnit}
                  onChange={(e) => {
                    const unit = e.target.value as LeadUnit;
                    setCustomUnit(unit);
                    const total = Math.round((Number(customAmount) || 0) * UNIT_MINUTES[unit]);
                    setForm((f) => ({ ...f, leadTimeMinutes: String(total) }));
                  }}
                  className="rounded-md border border-sand bg-white px-3 py-2 text-sm"
                >
                  <option value="minutes">minutes before pickup</option>
                  <option value="hours">hours before pickup</option>
                  <option value="days">days before pickup</option>
                </select>
              </div>
            )}
            <p className="mt-1 text-xs text-charcoal/50">
              {Number(form.leadTimeMinutes) > 0
                ? `Customers must order at least ${leadTimeLabel(Number(form.leadTimeMinutes))} before pickup. They see this on the product, in their cart and on the order form, and earlier pickup times are switched off for them.`
                : "No minimum — customers can pick any free pickup time."}
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">
              Cost (optional, admin-only)
            </label>
            <input
              type="number"
              min={0}
              value={form.cost}
              onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
              className="mt-1 w-full rounded-md border border-sand px-3 py-2"
              placeholder="Never shown to customers"
            />
          </div>

          <div className="sm:col-span-2 rounded-md border border-sand bg-sand/10 p-3">
            <label className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">
              Homepage photo pile — position (1–{MAX_HOME_POSITION})
            </label>
            <input
              type="number"
              min={0}
              max={MAX_HOME_POSITION}
              value={form.featuredOrder}
              onChange={(e) =>
                setForm((f) => ({ ...f, featuredOrder: Math.min(MAX_HOME_POSITION, Math.max(0, parseInt(e.target.value) || 0)) }))
              }
              className="mt-1 w-32 rounded-md border border-sand bg-white px-3 py-2"
              placeholder="0 = hidden"
            />
            {homeClash && (
              <p className="mt-1 text-xs text-amber-800">
                Position {form.featuredOrder} is already used by &quot;{homeClash.name}&quot;. Both will show, the
                newer product first.
              </p>
            )}
            <p className="mt-1 text-xs text-charcoal/50">
              The pile of tossed photos at the very top of the homepage. Give this product a number from 1 to{" "}
              {MAX_HOME_POSITION} to include it — 1 is placed first. Leave it at 0 to keep it out. Works for any
              category (bouquets, khata, flags), so you decide the exact mix. If no product has a number, a default
              mix is shown. The cover (first) photo is the one used there.
            </p>
          </div>

          <div className="sm:col-span-2 rounded-md border border-sand bg-sand/10 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">
              Order in the product catalog (1–{MAX_CATALOG_POSITION}, 0 = not numbered)
            </p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs text-charcoal/70">Position in &quot;All products&quot;</label>
                <input
                  type="number"
                  min={0}
                  max={MAX_CATALOG_POSITION}
                  value={form.catalogOrder}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, catalogOrder: Math.min(MAX_CATALOG_POSITION, Math.max(0, parseInt(e.target.value) || 0)) }))
                  }
                  className="mt-1 w-32 rounded-md border border-sand bg-white px-3 py-2"
                />
                {catalogClash && (
                  <p className="mt-1 text-xs text-amber-800">Also used by &quot;{catalogClash.name}&quot;.</p>
                )}
              </div>
              <div>
                <label className="text-xs text-charcoal/70">Position inside its section ({formCategory})</label>
                <input
                  type="number"
                  min={0}
                  max={MAX_CATALOG_POSITION}
                  value={form.categoryOrder}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, categoryOrder: Math.min(MAX_CATALOG_POSITION, Math.max(0, parseInt(e.target.value) || 0)) }))
                  }
                  className="mt-1 w-32 rounded-md border border-sand bg-white px-3 py-2"
                />
                {categoryClash && (
                  <p className="mt-1 text-xs text-amber-800">Also used by &quot;{categoryClash.name}&quot; in this section.</p>
                )}
              </div>
            </div>
            <p className="mt-2 text-xs text-charcoal/50">
              <strong>All products</strong> is the page customers see with no section chosen (and the order of the homepage
              rows). <strong>Section</strong> is the order inside Bouquets, Khata, Flags or any category you add. Inside
              Bouquets the order is kept within the Natural and Artificial tabs. Numbered products come first, lowest
              number first; products with 0 follow, newest first. Leave gaps (10, 20, 30…) so you can slot new products
              in later without renumbering.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-6">
            <label className="flex items-center gap-2 text-sm text-charcoal">
              <input
                type="checkbox"
                checked={form.todayPick}
                onChange={(e) => setForm((f) => ({ ...f, todayPick: e.target.checked }))}
              />
              Show in &quot;Best sellers&quot; row
            </label>
            <label className="flex items-center gap-2 text-sm text-charcoal">
              <input
                type="checkbox"
                checked={form.available}
                onChange={(e) => setForm((f) => ({ ...f, available: e.target.checked }))}
              />
              Available
            </label>
            <label className="flex items-center gap-2 text-sm text-charcoal">
              <input
                type="checkbox"
                checked={form.customizable}
                onChange={(e) => setForm((f) => ({ ...f, customizable: e.target.checked }))}
              />
              Customizable
            </label>
          </div>
          <p className="mt-1 text-xs text-charcoal/50 sm:col-span-2">
            The homepage lists products in rows: Best sellers (ticked above), then Fresh bouquets, Long-lasting
            (artificial), any bouquets with no type yet, and Khata, flags &amp; more. Each product appears in one
            row only, and empty rows are hidden.
          </p>
        </div>

        {formError && <p className="mt-3 text-sm text-rose-dark">{formError}</p>}

        <div className="mt-4 flex gap-3">
          <button
            type="submit"
            disabled={saving || uploading || dbNotConnected}
            className="rounded-full bg-charcoal px-6 py-2.5 text-sm font-semibold text-ivory hover:bg-charcoal/80 disabled:opacity-60"
          >
            {saving ? "Saving…" : uploading ? "Uploading photos…" : editingId ? "Save changes" : "Add product"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-full border border-sand px-6 py-2.5 text-sm font-semibold text-charcoal hover:bg-sand/40"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Existing products */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl italic text-charcoal">Current catalog</h2>
          {!loading && !error && (
            <div className="text-sm text-charcoal/70">
              <span className="font-semibold text-charcoal">{products.length}</span> total product{products.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        {loading && <p className="mt-4 text-sm text-charcoal/60">Loading…</p>}
        {error && <p className="mt-4 text-sm text-rose-dark">{error}</p>}

        {!loading && !error && unsortedCount > 0 && !dbNotConnected && (
          <button
            type="button"
            onClick={() => setFilterUnsorted((v) => !v)}
            className={`mt-4 w-full rounded-card border px-4 py-3 text-left text-sm transition ${
              filterUnsorted ? "border-amber-400 bg-amber-100 text-amber-900" : "border-amber-200 bg-amber-50 text-amber-900 hover:border-amber-400"
            }`}
          >
            <strong>{unsortedCount}</strong> bouquet{unsortedCount !== 1 ? "s have" : " has"} no &quot;fresh or
            artificial&quot; type yet.{" "}
            <span className="underline">{filterUnsorted ? "Show all products" : "Show only these"}</span>
          </button>
        )}

        {!loading && !error && products.length > 0 && (
          <>
            {/* Category breakdown */}
            <div className="mt-4 flex flex-wrap gap-2">
              {categories.map((cat) => {
                const count = products.filter((p) => (p.category || "Bouquets") === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(filterCategory === cat ? "" : cat)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      filterCategory === cat
                        ? "bg-charcoal text-ivory"
                        : "bg-sand/50 text-charcoal hover:bg-sand"
                    }`}
                  >
                    {cat} <span className="ml-1 opacity-75">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="mt-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">
                Search products
              </label>
              <input
                type="text"
                placeholder="e.g. Red Rose, Khata, Flag"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mt-1 w-full rounded-md border border-sand px-3 py-2"
              />
            </div>
          </>
        )}

        {(() => {
          const filtered = products.filter((p) => {
            const matchesSearch =
              searchQuery === "" ||
              p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (p.description?.toLowerCase() || "").includes(searchQuery.toLowerCase());
            const matchesCategory = filterCategory === "" || p.category === filterCategory;
            const matchesUnsorted = !filterUnsorted || isUnsorted(p);
            return matchesSearch && matchesCategory && matchesUnsorted;
          });

          if (filtered.length === 0 && !loading && products.length > 0) {
            return (
              <div className="mt-6 rounded-card border border-sand/50 bg-sand/10 p-6 text-center">
                <p className="text-sm text-charcoal/60">No products match your filter.</p>
              </div>
            );
          }

          return (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {filtered.map((p) => {
                const photoCount = p.images && p.images.length > 0 ? p.images.length : p.image ? 1 : 0;
                return (
                  <div
                    key={p._id}
                    className="flex gap-3 rounded-card border border-sand bg-white p-4"
                  >
                    {p.image && (
                      <div className="relative h-16 w-16 flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.image}
                          alt={p.name}
                          className="h-16 w-16 rounded-md object-cover"
                        />
                        {photoCount > 1 && (
                          <span className="absolute -bottom-1 -right-1 rounded-full bg-charcoal px-1.5 py-0.5 text-[10px] font-semibold text-ivory">
                            {photoCount}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-charcoal">{p.name}</p>
                      <p className="text-sm text-charcoal/60">Rs. {p.price.toLocaleString("en-IN")}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="inline-block rounded-full bg-sage-light px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-sage-dark">
                          {p.category || "Bouquets"}
                        </span>
                        {p.kind === "fresh" && (
                          <span className="inline-block rounded-full bg-sage-light px-2 py-0.5 text-[10px] font-semibold text-sage-dark">
                            Fresh
                          </span>
                        )}
                        {p.kind === "artificial" && (
                          <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                            Artificial
                          </span>
                        )}
                        {isUnsorted(p) && (
                          <span className="inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 ring-1 ring-amber-300">
                            Type not set
                          </span>
                        )}
                        {p.featured && (
                          <span className="inline-block rounded-full bg-rose/20 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-rose-dark">
                            Homepage stack {p.featuredOrder && `(#${p.featuredOrder})`}
                          </span>
                        )}
                      </div>
                      {((p.catalogOrder || 0) > 0 || (p.categoryOrder || 0) > 0) && (
                        <p className="mt-1 font-mono text-[11px] text-charcoal/50">
                          {(p.catalogOrder || 0) > 0 ? `All #${p.catalogOrder}` : ""}
                          {(p.catalogOrder || 0) > 0 && (p.categoryOrder || 0) > 0 ? " · " : ""}
                          {(p.categoryOrder || 0) > 0 ? `Section #${p.categoryOrder}` : ""}
                        </p>
                      )}
                      {p.tags && p.tags.length > 0 && (
                        <p className="mt-1 text-xs text-charcoal/60">
                          {p.tags.map((o) => `${OCCASION_EMOJI[o]} ${OCCASION_LABEL_EN[o]}`).join("  ")}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-charcoal/50">
                        {p.customizable ? "Customizable" : ""}
                        {p.customizable && (p.leadTimeMinutes || 0) > 0 ? " · " : ""}
                        {(p.leadTimeMinutes || 0) > 0 ? `Order ${leadTimeLabel(p.leadTimeMinutes || 0)} ahead` : ""}
                      </p>
                      {!dbNotConnected && (
                        <button
                          type="button"
                          role="switch"
                          aria-checked={p.available}
                          aria-label={`${p.name} available`}
                          disabled={toggling[p._id]}
                          onClick={() => handleToggleAvailable(p)}
                          className="mt-2 flex items-center gap-2 disabled:opacity-60"
                        >
                          <span
                            className={`relative inline-block h-6 w-11 rounded-full transition ${
                              p.available ? "bg-sage" : "bg-charcoal/25"
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                                p.available ? "left-[1.375rem]" : "left-0.5"
                              }`}
                            />
                          </span>
                          <span className={`text-xs font-semibold ${p.available ? "text-sage-dark" : "text-charcoal/50"}`}>
                            {p.available ? "Available" : "Sold out"}
                          </span>
                        </button>
                      )}
                      {!dbNotConnected && (
                        <button
                          type="button"
                          role="switch"
                          aria-checked={p.todayPick ?? false}
                          aria-label={`${p.name} best seller`}
                          disabled={toggling[`pick-${p._id}`]}
                          onClick={() => handleToggleTodayPick(p)}
                          className="mt-2 flex items-center gap-2 disabled:opacity-60"
                        >
                          <span
                            className={`relative inline-block h-6 w-11 rounded-full transition ${
                              p.todayPick ? "bg-rose" : "bg-charcoal/25"
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                                p.todayPick ? "left-[1.375rem]" : "left-0.5"
                              }`}
                            />
                          </span>
                          <span className={`text-xs font-semibold ${p.todayPick ? "text-rose-dark" : "text-charcoal/50"}`}>
                            {p.todayPick ? "Best seller" : "Not in best sellers"}
                          </span>
                        </button>
                      )}
                      {!dbNotConnected && (
                        <div className="mt-2 flex gap-3 text-sm">
                          <button onClick={() => startEdit(p)} className="text-rose-dark hover:underline">
                            Edit
                          </button>
                          <button onClick={() => handleDelete(p._id)} className="text-charcoal/60 hover:text-rose-dark hover:underline">
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
