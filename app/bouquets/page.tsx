import { Metadata } from "next";
import ProductBrowser from "@/components/ProductBrowser";
import LocalizedWhatsAppButton from "@/components/LocalizedWhatsAppButton";
import T from "@/components/T";
import { getAllBouquets, getCategories } from "@/lib/products";
import { sortByPosition } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Products | TIA Flower Shop",
  description:
    "Browse today's bouquets, khata, flags, and more — ready for pickup near Tribhuvan International Airport, Kathmandu.",
};

export default async function BouquetsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>> | Record<string, string>;
}) {
  const params = await searchParams;
  const selectedCategory = params.category || "";

  const bouquets = await getAllBouquets();
  const filtered = selectedCategory
    ? bouquets.filter((b) => b.category === selectedCategory)
    : bouquets;
  // The admin's position numbers decide the order: "All products" uses the catalog
  // position, a category section (Bouquets, Khata, Flags…) uses the category position.
  // Products without a number follow, newest first.
  const ordered = sortByPosition(filtered, selectedCategory ? "categoryOrder" : "catalogOrder");
  const available = ordered.filter((b) => b.available);
  const soldOut = ordered.filter((b) => !b.available);

  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl italic text-charcoal">
        {selectedCategory || <T k="cat.allProducts" />}
      </h1>
      <p className="mt-2 max-w-xl text-charcoal/70">
        <T k="cat.intro" />
      </p>

      {/* Category filter tabs */}
      {categories.length > 1 && (
        <div className="mt-6 flex flex-wrap gap-2 border-b border-sand pb-4">
          <a
            href="/bouquets"
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              !selectedCategory
                ? "bg-charcoal text-ivory"
                : "bg-sand/50 text-charcoal hover:bg-sand"
            }`}
          >
            <T k="cat.all" />
          </a>
          {categories.map((cat) => (
            <a
              key={cat}
              href={`/bouquets?category=${encodeURIComponent(cat)}`}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                selectedCategory === cat
                  ? "bg-charcoal text-ivory"
                  : "bg-sand/50 text-charcoal hover:bg-sand"
              }`}
            >
              {cat}
            </a>
          ))}
        </div>
      )}

      {/* key makes the search box reset when the category link changes */}
      <ProductBrowser key={selectedCategory} available={available} soldOut={soldOut} />

      <div className="mt-10 flex flex-wrap items-center gap-3 rounded-card border border-sand bg-white p-4">
        <p className="flex-1 text-sm text-charcoal/70">
          <T k="home.help.body" />
        </p>
        <LocalizedWhatsAppButton
          labelKey="cat.help"
          message="Hi! I need help choosing flowers. Occasion: ___ · Pickup time: ___ · Budget: Rs. ___"
        />
      </div>
    </div>
  );
}
