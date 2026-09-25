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

  // Homepage photo stack, at the very top of the page (what the customer calls
  // "the scattered cards below Ask on WhatsApp"). Admins control this from
  // /admin/products: each bouquet has one "Homepage stack position" number
  // (1-10). Items with a position show first, lowest number first, up to 10,
  // from any category — there's no fixed split between bouquets/khata/flags.
  // If no admin has set a position yet, a sensible default mix is shown so
  // the homepage is never empty on a fresh install.
  const MAX_COLLAGE_ITEMS = 10;
  const positioned = bouquets
    .filter((b) => b.available && b.featured && (b.featuredOrder || 0) > 0)
    .sort((a, b) => (a.featuredOrder || 0) - (b.featuredOrder || 0))
    .slice(0, MAX_COLLAGE_ITEMS);

  let collage = positioned;
  if (collage.length === 0) {
    // Default mix, only used until any admin sets a stack position: a few
    // bouquets plus one khata and one flag, so all categories are represented.
    const defaultBouquets = bouquets.filter((b) => b.available && b.category === "Bouquets").slice(0, 4);
    const defaultKhata = bouquets.filter((b) => b.available && b.category === "Khata").slice(0, 2);
    const defaultFlag = bouquets.filter((b) => b.available && b.category === "Flags").slice(0, 1);
    collage = [...defaultKhata, ...defaultBouquets, ...defaultFlag];
  }

  // "Today's items": the admin ticks "Show in Today's items" per bouquet, in any
  // category (see /admin/products). Picked items show first, in category order
  // (Bouquets, then others). If the admin hasn't picked at least 8, the rest are
  // filled in automatically (also category-first) so mobile always shows a full
  // 4-row grid (2 columns × 4 rows) instead of a half-empty section.
  const MIN_TODAY_ITEMS = 8;
  const available = bouquets.filter((b) => b.available);
  const byCategoryFirst = (a: (typeof available)[number], b: (typeof available)[number]) => {
    if (a.category === "Bouquets" && b.category !== "Bouquets") return -1;
    if (a.category !== "Bouquets" && b.category === "Bouquets") return 1;
    return 0;
  };

  const picked = available.filter((b) => b.todayPick).sort(byCategoryFirst);
  const rest = available.filter((b) => !b.todayPick).sort(byCategoryFirst);
  const todayItems = [...picked, ...rest].slice(0, Math.max(MIN_TODAY_ITEMS, picked.length));

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
            <div className="mx-auto mt-2 flex max-w-sm flex-wrap items-center justify-center py-4 lg:max-w-xl">
              {collage.map((item, idx) => {
                // Small deterministic wobble so the photos look like a loosely
                // tossed pile, however many there are (1 to 10). Overlap comes
                // from the negative left margin; later cards paint on top.
                const rotations = ["-rotate-6", "rotate-3", "-rotate-2", "rotate-6", "-rotate-3", "rotate-2"];
                const lifts = ["translate-y-0", "translate-y-3", "-translate-y-2", "translate-y-2", "-translate-y-3", "translate-y-1"];
                const rotate = rotations[idx % rotations.length];
                const lift = lifts[idx % lifts.length];

                return (
                  <Link
                    key={item.id}
                    href={`/bouquets/${item.id}`}
                    className={`group relative -ml-6 h-40 w-32 shrink-0 overflow-hidden rounded-lg border-2 border-white shadow-md transition-transform hover:z-20 hover:scale-105 hover:shadow-xl first:ml-0 sm:h-48 sm:w-40 lg:h-56 lg:w-44 ${rotate} ${lift}`}
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
                    <div className="absolute inset-0 flex items-end bg-black/0 p-2 transition-colors group-hover:bg-black/40">
                      <div className="opacity-0 transition-opacity group-hover:opacity-100">
                        <p className="text-[10px] font-medium uppercase text-white/70">
                          {item.category || "Bouquets"}
                        </p>
                        <p className="line-clamp-2 text-xs font-semibold text-white">{item.name}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="mt-8 rounded-lg border border-sand/30 bg-sand/10 p-8 text-center">
              <p className="text-sm text-charcoal/60">No bouquets to show yet — add one in the admin dashboard.</p>
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
