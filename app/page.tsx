import Link from "next/link";
import Image from "next/image";
import BouquetCard from "@/components/BouquetCard";
import AddToCartButton from "@/components/AddToCartButton";
import ShopStatusBadge from "@/components/ShopStatusBadge";
import WhatsAppButton from "@/components/WhatsAppButton";
import { getAllBouquets } from "@/lib/products";

export const dynamic = "force-dynamic";

const STEPS = [
  { title: "Browse", body: "See today's available bouquets and prices." },
  { title: "Choose a time", body: "Pick when you'll be near TIA." },
  { title: "We prepare", body: "Your bouquet is made fresh, at home." },
  {
    title: "Meet & receive",
    body: "We hand it to you near TIA. Free, no delivery cost.",
  },
];

export default async function HomePage() {
  const bouquets = await getAllBouquets();

  // Get featured bouquets only (up to 4) - admin selects these
  const featuredBouquets = bouquets
    .filter((b) => b.featured === true && b.category === "Bouquets")
    .sort((a, b) => (a.featuredOrder || 0) - (b.featuredOrder || 0))
    .slice(0, 4);

  // Get featured khata (up to 2) - if none featured, show first 2 available
  let featuredKhata = bouquets
    .filter((b) => b.featured === true && b.category === "Khata")
    .sort((a, b) => (a.featuredOrder || 0) - (b.featuredOrder || 0))
    .slice(0, 2);

  if (featuredKhata.length === 0) {
    featuredKhata = bouquets.filter((b) => b.category === "Khata").slice(0, 2);
  }

  // Get featured flag (1 item) - if none featured, show first available
  let featuredFlag = bouquets
    .filter((b) => b.featured === true && b.category === "Flags")
    .sort((a, b) => (a.featuredOrder || 0) - (b.featuredOrder || 0))
    .slice(0, 1);

  if (featuredFlag.length === 0) {
    featuredFlag = bouquets.filter((b) => b.category === "Flags").slice(0, 1);
  }

  // Build collage: 2 khata + 4 bouquets + 1 flag = 7 items
  const collage = [
    featuredKhata[0],
    featuredKhata[1],
    featuredBouquets[0],
    featuredBouquets[1],
    featuredBouquets[2],
    featuredBouquets[3],
    featuredFlag[0],
  ].filter(Boolean);

  // For "Today's items": sort by category (bouquets first), then take first 4
  const available = bouquets.filter((b) => b.available);
  const todayItems = available
    .sort((a, b) => {
      // Bouquets come first
      if (a.category === "Bouquets" && b.category !== "Bouquets") return -1;
      if (a.category !== "Bouquets" && b.category === "Bouquets") return 1;
      return 0;
    })
    .slice(0, 4);

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
              Sending someone abroad or welcoming them home? We'll prepare fresh
              flowers for your special moment and have them ready near TIA when
              you need them.
              <span className="block mt-2 text-rose-500 italic">
                We prepare bouquets at home and deliver them near airport. We do
                not have our physical shop yet!!
              </span>
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

          {collage.length > 0 ? (
            <div className="relative mx-auto w-full max-w-sm lg:max-w-none h-64 sm:h-80 lg:h-96">
              {collage.map((item, idx) => {
                // Positions for overlapping tossed card effect
                const mobilePositions = [
                  "left-2 top-0 -rotate-12 z-10",
                  "left-12 top-2 rotate-6 z-20",
                  "left-1/2 top-4 -translate-x-1/2 -rotate-2 z-30",
                  "right-12 top-2 -rotate-6 z-20",
                  "right-2 top-0 rotate-12 z-10",
                  "left-1/4 bottom-4 rotate-3 z-15",
                  "right-1/4 bottom-4 -rotate-3 z-15",
                ];

                const desktopPositions = [
                  "left-0 top-8 -rotate-6 z-10",
                  "left-1/4 top-2 rotate-3 z-20",
                  "left-1/2 top-0 -translate-x-1/2 z-30",
                  "right-1/4 top-2 -rotate-3 z-20",
                  "right-0 top-8 rotate-6 z-10",
                  "left-1/3 bottom-0 rotate-2 z-15",
                  "right-1/3 bottom-0 -rotate-2 z-15",
                ];

                const position = mobilePositions[idx] || mobilePositions[0];

                return (
                  <Link
                    key={item.id}
                    href={`/bouquets/${item.id}`}
                    className={`absolute overflow-hidden rounded-lg shadow-md transition-all hover:shadow-xl hover:scale-105 h-40 w-32 sm:h-48 sm:w-40 lg:h-56 lg:w-44 ${position}`}
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="176px"
                      priority={idx < 3}
                    />
                    {/* Dark overlay on hover with category + name */}
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-end p-2">
                      <div className="opacity-0 hover:opacity-100 transition-opacity">
                        <p className="text-[10px] font-medium text-white/70 uppercase">
                          {item.category || "Bouquets"}
                        </p>
                        <p className="text-xs font-semibold text-white line-clamp-2">
                          {item.name}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="mt-8 rounded-lg border border-sand/30 bg-sand/10 p-8 text-center">
              <p className="text-sm text-charcoal/60">
                Featured products loading...
              </p>
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="font-display text-2xl italic text-charcoal">
          How ordering works
        </h2>

        <div className="relative mt-10">
          {/* connecting line: vertical on mobile, horizontal on desktop */}
          <div className="absolute left-4 top-0 h-full w-px bg-rose/20 sm:left-0 sm:top-4 sm:h-px sm:w-full" />
          <ol className="relative grid gap-8 sm:grid-cols-4 sm:gap-6">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative pl-12 sm:pl-0">
                <span className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-rose font-display text-sm italic text-ivory sm:static sm:mb-4 sm:inline-flex">
                  {i + 1}
                </span>
                <h3 className="font-display text-lg text-charcoal">
                  {s.title}
                </h3>
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
            <h2 className="font-display text-2xl italic text-charcoal">
              Today's items
            </h2>
            <Link
              href="/bouquets"
              className="text-sm font-semibold text-rose-dark hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {todayItems.map((b) => (
              <BouquetCard key={b.id} bouquet={b} />
            ))}
          </div>
        </div>
      </section>

      {/* TIA info */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="font-display text-2xl italic text-charcoal">
          Meeting you near TIA
        </h2>
        <p className="mt-3 max-w-2xl text-charcoal/70">
          We prepare every bouquet about two minutes' walk from Tribhuvan
          International Airport, and hand it to you near the terminal — free of
          charge. Tell us your preferred meeting point, date and time when you
          order, and we'll confirm the exact spot on WhatsApp. Please allow at
          least 30–60 minutes' notice so we can prepare it fresh.
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
