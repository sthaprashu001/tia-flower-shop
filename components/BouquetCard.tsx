import Link from "next/link";
import Image from "next/image";
import { Bouquet } from "@/lib/types";
import AddToCartButton from "./AddToCartButton";
import LeadTimeNote from "./LeadTimeNote";
import T from "./T";

export default function BouquetCard({ bouquet }: { bouquet: Bouquet }) {
  return (
    <Link
      href={`/bouquets/${bouquet.id}`}
      className={`group block overflow-hidden rounded-card border border-sand bg-white transition hover:-translate-y-0.5 hover:shadow-md ${
        !bouquet.available ? "opacity-60" : ""
      }`}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-sand">
        <Image
          src={bouquet.image}
          alt={`${bouquet.name} — fresh bouquet delivery near TIA, Kathmandu`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition group-hover:scale-105"
        />
        {!bouquet.available && (
          <span className="absolute right-2 top-2 rounded-full bg-charcoal/80 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-ivory">
            <T k="card.soldOut" />
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 truncate font-display text-lg text-charcoal">{bouquet.name}</h3>
          <span className="flex-shrink-0 whitespace-nowrap font-mono text-sm font-bold text-rose-dark">
            Rs. {bouquet.price.toLocaleString("en-IN")}
          </span>
        </div>
        <p className="mt-1.5 line-clamp-2 text-sm text-charcoal/70">
          {bouquet.description}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {bouquet.customizable && (
            <span className="inline-block rounded-full bg-sage-light px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-sage-dark">
              <T k="card.customizable" />
            </span>
          )}
          {(bouquet.leadTimeHours || 0) > 0 && (
            <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-amber-800">
              <LeadTimeNote hours={bouquet.leadTimeHours || 0} k="card.leadTime" />
            </span>
          )}
        </div>
        <AddToCartButton bouquetId={bouquet.id} available={bouquet.available} />
      </div>
    </Link>
  );
}
