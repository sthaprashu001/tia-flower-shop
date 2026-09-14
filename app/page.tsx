import Link from "next/link";
import Image from "next/image";
import BouquetCard from "@/components/BouquetCard";
import ShopStatusBadge from "@/components/ShopStatusBadge";
import WhatsAppButton from "@/components/WhatsAppButton";
import { getAllBouquets } from "@/lib/products";

export const dynamic = "force-dynamic";

const STEPS = [
  { title: "Browse", body: "See today's available bouquets and prices." },
  { title: "Choose a time", body: "Pick when you'll be near TIA." },
  { title: "We prepare", body: "Your bouquet is made fresh, at home." },
  { title: "Meet & receive", body: "We hand it to you near TIA. Free, no delivery cost." },
];

const COLLAGE_POSITIONS: Record<number, string[]> = {
  1: ["left-1/2 top-0 -translate-x-1/2 z-20"],
  2: [
    "left-1/2 top-2 -translate-x-[75%] rotate-[-5deg] z-10",
    "left-1/2 top-0 -translate-x-[25%] rotate-[5deg] z-20",
  ],
  3: [
    "left-1/2 top-2 -translate-x-[80%] rotate-[-6deg] z-10",
    "left-1/2 top-0 -translate-x-1/2 z-20",
    "left-1/2 top-2 -translate-x-[20%] rotate-[6deg] z-10",
  ],
};

export default async function HomePage() {
  const bouquets = await getAllBouquets();
  const available = bouquets.filter((b) => b.available).slice(0, 4);
  const collage = available.slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <section className="bg-cream">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:py-16 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <ShopStatusBadge />
            <h1 className="mt-5 max-w-md font-display text-4xl italic leading-tight text-charcoal sm:text-5xl">
              Flowers for arrivals &amp; farewells.
            </h1>
            <p className="mt-4 max-w-md text-charcoal/70">
              Sending someone abroad or welcoming them home? We'll prepare
              fresh flowers for your special moment and have them ready near
              TIA when you need them.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/bouquets"
                className="rounded-full bg-rose px-6 py-3 text-sm font-semibold text-ivory transition hover:bg-rose-dark"
              >
                See today's bouquets
              </Link>
              <WhatsAppButton label="Ask on WhatsApp" />
            </div>
          </div>

          {collage.length > 0 && (
            <div className="relative mx-auto h-52 w-full max-w-xs sm:h-64 lg:mx-0 lg:h-72 lg:max-w-none">
              {collage.map((b, i) => {
                const positions = COLLAGE_POSITIONS[collage.length];
                return (
                  <div
                    key={b.id}
                    className={`absolute h-40 w-32 overflow-hidden rounded-2xl shadow-lg shadow-charcoal/15 sm:h-52 sm:w-40 lg:h-60 lg:w-44 ${positions[i]}`}
                  >
                    <Image
                      src={b.image}
                      alt={`${b.name} — fresh bouquet delivery near TIA, Kathmandu`}
                      fill
                      sizes="176px"
                      className="object-cover"
                      priority={i === 1}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="font-display text-2xl italic text-charcoal">How ordering works</h2>

        <div className="relative mt-10">
          {/* connecting line: vertical on mobile, horizontal on desktop */}
          <div className="absolute left-4 top-0 h-full w-px bg-rose/20 sm:left-0 sm:top-4 sm:h-px sm:w-full" />
          <ol className="relative grid gap-8 sm:grid-cols-4 sm:gap-6">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative pl-12 sm:pl-0">
                <span className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-rose font-display text-sm italic text-ivory sm:static sm:mb-4 sm:inline-flex">
                  {i + 1}
                </span>
                <h3 className="font-display text-lg text-charcoal">{s.title}</h3>
                <p className="mt-1 text-sm text-charcoal/70">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Today's bouquets */}
      <section className="bg-cream">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl italic text-charcoal">Today's bouquets</h2>
            <Link href="/bouquets" className="text-sm font-semibold text-rose-dark hover:underline">
              View all →
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {available.map((b) => (
              <BouquetCard key={b.id} bouquet={b} />
            ))}
          </div>
        </div>
      </section>

      {/* TIA info */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="font-display text-2xl italic text-charcoal">Meeting you near TIA</h2>
        <p className="mt-3 max-w-2xl text-charcoal/70">
          We prepare every bouquet about two minutes' walk from Tribhuvan
          International Airport, and hand it to you near the terminal — free
          of charge. Tell us your preferred meeting point, date and time
          when you order, and we'll confirm the exact spot on WhatsApp.
          Please allow at least 30–60 minutes' notice so we can prepare it
          fresh.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/order"
            className="rounded-full bg-charcoal px-6 py-3 text-sm font-semibold text-ivory transition hover:bg-charcoal/80"
          >
            Place an order
          </Link>
          <Link
            href="/contact"
            className="rounded-full border border-charcoal/20 px-6 py-3 text-sm font-semibold text-charcoal transition hover:border-charcoal/40"
          >
            Contact us
          </Link>
        </div>
      </section>
    </div>
  );
}
