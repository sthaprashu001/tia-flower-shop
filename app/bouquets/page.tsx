import { Metadata } from "next";
import BouquetCard from "@/components/BouquetCard";
import { bouquets } from "@/lib/data";

export const metadata: Metadata = {
  title: "Bouquets | TIA Flower Shop",
};

export default function BouquetsPage() {
  const available = bouquets.filter((b) => b.available);
  const soldOut = bouquets.filter((b) => !b.available);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl italic text-charcoal">Bouquets</h1>
      <p className="mt-2 max-w-xl text-charcoal/70">
        What's available today, prepared fresh near TIA. Prices are in
        Nepali Rupees. Tap a bouquet to customize it or add it to your order.
      </p>

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
