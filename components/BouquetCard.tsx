import Link from "next/link";
import { Bouquet } from "@/lib/types";

export default function BouquetCard({ bouquet }: { bouquet: Bouquet }) {
  return (
    <Link
      href={`/bouquets/${bouquet.id}`}
      className={`group block overflow-hidden rounded-card border border-sand bg-white transition hover:-translate-y-0.5 hover:shadow-md ${
        !bouquet.available ? "opacity-60" : ""
      }`}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-sand">
        {/* Replace with next/image once real photos are in /public/images */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={bouquet.image}
          alt={bouquet.name}
          className="h-full w-full object-cover transition group-hover:scale-105"
        />
        {!bouquet.available && (
          <span className="absolute right-2 top-2 rounded-full bg-charcoal/80 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-ivory">
            Sold out today
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg text-charcoal">{bouquet.name}</h3>
          <span className="whitespace-nowrap font-mono text-sm font-bold text-rose-dark">
            Rs. {bouquet.price.toLocaleString("en-IN")}
          </span>
        </div>
        <p className="mt-1.5 line-clamp-2 text-sm text-charcoal/70">
          {bouquet.description}
        </p>
        {bouquet.customizable && (
          <span className="mt-2 inline-block rounded-full bg-sage-light px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-sage-dark">
            Customizable
          </span>
        )}
      </div>
    </Link>
  );
}
