import { Metadata } from "next";
import BouquetCard from "@/components/BouquetCard";
import { getAllBouquets, getCategories } from "@/lib/products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Products | TIA Flower Shop",
  description:
    "Browse today's fresh bouquets, khata, flags, and more — ready for pickup near Tribhuvan International Airport, Kathmandu.",
};

export default async function BouquetsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const selectedCategory = params.category || "";
  
  const bouquets = await getAllBouquets();
  const filtered = selectedCategory
    ? bouquets.filter((b) => b.category === selectedCategory)
    : bouquets;
  const available = filtered.filter((b) => b.available);
  const soldOut = filtered.filter((b) => !b.available);
  
  const categories = await getCategories();
  const pageTitle = selectedCategory || "All Products";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl italic text-charcoal">{pageTitle}</h1>
      <p className="mt-2 max-w-xl text-charcoal/70">
        What's available today, prepared fresh near TIA. Prices are in
        Nepali Rupees. Tap a product to customize it or add it to your order.
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
            All
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

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {available.map((b) => (
          <BouquetCard key={b.id} bouquet={b} />
        ))}
      </div>

      {soldOut.length > 0 && (
        <div className="mt-12">
          <h2 className="font-display text-xl italic text-charcoal/70">
            Currently unavailable
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {soldOut.map((b) => (
              <BouquetCard key={b.id} bouquet={b} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
