import Image from "next/image";
import { HANDOVER_PHOTO, REVIEWS } from "@/lib/trust";
import T from "./T";

/** Real customer comments (edit lib/trust.ts). Hidden until there is at least one. */
export function Reviews() {
  if (REVIEWS.length === 0) return null;
  return (
    <section className="mx-auto max-w-5xl px-4 py-16">
      <h2 className="font-display text-2xl italic text-charcoal">
        <T k="home.reviews.title" />
      </h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-3">
        {REVIEWS.slice(0, 6).map((r, i) => (
          <li key={i} className="rounded-card border border-sand bg-white p-5">
            <p className="text-sm text-charcoal/80">&ldquo;{r.text}&rdquo;</p>
            <p className="mt-3 text-sm font-semibold text-charcoal">{r.name}</p>
            {r.detail && <p className="text-xs text-charcoal/60">{r.detail}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** "Who we are" + the promise, with an optional real handover photo. */
export function PromiseAbout() {
  return (
    <section className="border-t border-sand bg-white">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-14 sm:grid-cols-2 sm:items-center">
        <div>
          <h2 className="font-display text-2xl italic text-charcoal">
            <T k="home.about.title" />
          </h2>
          <p className="mt-3 text-charcoal/70">
            <T k="home.about.body" />
          </p>
          
        </div>
        {HANDOVER_PHOTO && (
          <div className="relative aspect-[4/3] overflow-hidden rounded-card border border-sand bg-sand">
            <Image
              src={HANDOVER_PHOTO}
              alt="A TIA Flower Shop order being handed over near the terminal of Tribhuvan International Airport"
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        )}
      </div>
    </section>
  );
}
