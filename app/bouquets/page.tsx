import { Metadata } from "next";
import ProductBrowser from "@/components/ProductBrowser";
import LocalizedWhatsAppButton from "@/components/LocalizedWhatsAppButton";
import T from "@/components/T";
import { getAllBouquets, getCategories } from "@/lib/products";
import { OCCASIONS, PRODUCT_KINDS } from "@/lib/types";

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
  // ?kind=fresh|artificial|other and ?occasion=welcome… come from homepage links.
  const kind = (PRODUCT_KINDS as readonly string[]).includes(params.kind) ? (params.kind as (typeof PRODUCT_KINDS)[number]) : "all";
  const occasion = (OCCASIONS as readonly string[]).includes(params.occasion) ? (params.occasion as (typeof OCCASIONS)[number]) : "all";

  const bouquets = await getAllBouquets();
  const filtered = selectedCategory
    ? bouquets.filter((b) => b.category === selectedCategory)
    : bouquets;
  const available = filtered.filter((b) => b.available);
  const soldOut = filtered.filter((b) => !b.available);

  const categories = await getCategories();
  const lowestPrice = available.length > 0 ? Math.min(...available.map((b) => b.price)) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl italic text-charcoal">
        {selectedCategory || <T k="cat.allProducts" />}
      </h1>
      <p className="mt-2 max-w-xl text-charcoal/70">
        <T k="cat.intro" />
      </p>
      {lowestPrice !== null && (
        <p className="mt-2 font-mono text-sm font-bold text-rose-dark">
          <T k="cat.fromPrice" vars={{ price: lowestPrice.toLocaleString("en-IN") }} />
        </p>
      )}

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

      {/* key makes the filters reset when the category link changes */}
      <ProductBrowser
        key={`${selectedCategory}|${kind}|${occasion}`}
        available={available}
        soldOut={soldOut}
        allowPopular={!selectedCategory}
        initialKind={kind}
        initialOccasion={occasion}
      />

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
