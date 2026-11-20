import Link from "next/link";
import Image from "next/image";
import BouquetCard from "@/components/BouquetCard";
import LocalizedWhatsAppButton from "@/components/LocalizedWhatsAppButton";
import ShopStatusBadge from "@/components/ShopStatusBadge";
import T from "@/components/T";
import { PromiseAbout, Reviews } from "@/components/TrustSections";
import { getAllBouquets } from "@/lib/products";
import { getShopSettings } from "@/lib/shopSettings";
import { Bouquet, MAX_HOME_POSITION, OCCASIONS, OCCASION_EMOJI, productKind, sortByPosition } from "@/lib/types";

export const dynamic = "force-dynamic";

// All visible text lives in lib/i18n.ts and lib/i18nExtra.ts (keys "home.*")
// so the English / Nepali switch works on the homepage too.
const STEPS = [
  { title: "home.step1.title", body: "home.step1.body" },
  { title: "home.step2.title", body: "home.step2.body" },
  { title: "home.step3.title", body: "home.step3.body" },
  { title: "home.step4.title", body: "home.step4.body" },
];

const TRUST = [
  { icon: "💬", title: "home.trust1.title", body: "home.trust1.body" },
  { icon: "🤝", title: "home.trust2.title", body: "home.trust2.body" },
  { icon: "🔎", title: "home.trust3.title", body: "home.trust3.body" },
];

const pad = (h: number) => `${String(h).padStart(2, "0")}:00`;

export default async function HomePage() {
  const [bouquets, settings] = await Promise.all([getAllBouquets(), getShopSettings()]);

  // Homepage photo stack, at the very top of the page. Admins control this from
  // /admin/products: each product has one "Homepage stack position" number
  // (1-12). Items with a position show first, lowest number first, up to 12,
  // from any category. If no admin has set a position yet, a sensible default
  // mix is shown so the homepage is never empty on a fresh install.
  const MAX_COLLAGE_ITEMS = MAX_HOME_POSITION;
  const positioned = bouquets
    .filter((b) => b.available && b.featured && (b.featuredOrder || 0) > 0)
    .sort((a, b) => (a.featuredOrder || 0) - (b.featuredOrder || 0))
    .slice(0, MAX_COLLAGE_ITEMS);

  let collage = positioned;
  if (collage.length === 0) {
    const defaultBouquets = bouquets.filter((b) => b.available && b.category === "Bouquets").slice(0, 4);
    const defaultKhata = bouquets.filter((b) => b.available && b.category === "Khata").slice(0, 2);
    // Accept both spellings so the default mix works with either category name.
    const defaultFlag = bouquets
      .filter((b) => b.available && (b.category === "Flags" || b.category === "Flag"))
      .slice(0, 1);
    collage = [...defaultKhata, ...defaultBouquets, ...defaultFlag];
  }
  // With many photos in the pile, make them a little smaller so it stays tidy.
  const cardSize =
    collage.length > 8
      ? "h-32 w-24 sm:h-40 sm:w-32 lg:h-48 lg:w-36"
      : "h-40 w-32 sm:h-48 sm:w-40 lg:h-56 lg:w-44";

  // Product rows. Each product appears in only one row, in this order:
  // Best sellers (admin ticks "Best sellers") → Fresh → Long-lasting →
  // other bouquets not yet classified → khata, flags & everything else.
  // Empty rows are hidden.
  // Rows follow the admin's "All products" position numbers, then newest first.
  const available = sortByPosition(bouquets.filter((b) => b.available), "catalogOrder");
  const used = new Set<string>();
  const take = (list: Bouquet[], n: number) => {
    const out = list.filter((b) => !used.has(b.id)).slice(0, n);
    out.forEach((b) => used.add(b.id));
    return out;
  };
  const isBouquet = (b: Bouquet) => b.category === "Bouquets";

  const rows = [
    { key: "best", title: "home.row.best", href: "/bouquets", items: take(available.filter((b) => b.todayPick), 8) },
    { key: "fresh", title: "home.row.fresh", href: "/bouquets?category=Bouquets&tab=natural", items: take(available.filter((b) => productKind(b) === "fresh"), 4) },
    { key: "long", title: "home.row.long", href: "/bouquets?category=Bouquets&tab=artificial", items: take(available.filter((b) => productKind(b) === "artificial"), 4) },
    { key: "more", title: "home.row.more", href: "/bouquets?category=Bouquets&tab=more", items: take(available.filter((b) => isBouquet(b) && !productKind(b)), 4) },
    { key: "khata", title: "home.row.khata", href: "/bouquets?kind=other", items: take(available.filter((b) => !isBouquet(b)), 4) },
  ].filter((r) => r.items.length > 0);

  // Occasion tiles only for occasions that have at least one available product.
  const occasions = OCCASIONS.filter((o) => available.some((b) => b.tags?.includes(o)));

  return (
    <div>
      {/* Hero */}
      <section className="bg-cream">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:py-16 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <ShopStatusBadge />
            <h1 className="mt-5 max-w-md font-display text-4xl italic leading-tight text-charcoal sm:text-5xl">
              <T k="home.hero.title" />
            </h1>
            <p className="mt-4 max-w-md text-charcoal/70">
              <T k="home.hero.body" />
            </p>
            <p className="mt-4 max-w-md rounded-card border border-sand bg-white/70 px-4 py-3 text-sm text-charcoal/80">
              <T k="home.hero.note" />
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/bouquets"
                className="rounded-full bg-rose px-6 py-3 text-sm font-semibold text-ivory transition hover:bg-rose-dark"
              >
                <T k="home.cta.browse" />
              </Link>
              <LocalizedWhatsAppButton labelKey="home.cta.whatsapp" />
            </div>
            <p className="mt-3 text-sm">
              <Link href="/order-status" className="font-semibold text-rose-dark hover:underline">
                <T k="home.cta.track" />
              </Link>
            </p>
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
                    className={`group relative -ml-6 ${cardSize} shrink-0 overflow-hidden rounded-lg border-2 border-white shadow-md transition-transform hover:z-20 hover:scale-105 hover:shadow-xl first:ml-0 ${rotate} ${lift}`}
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="176px"
                      priority={idx < 3}
                    />
                    {/* Name is always visible on phones (no hover there); on larger screens it appears on hover. */}
                    <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent p-2 transition-colors sm:bg-black/0 sm:bg-none sm:group-hover:bg-black/40">
                      <div className="sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
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
              <p className="text-sm text-charcoal/60">
                <T k="home.empty" />
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-sand bg-white">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <ul className="grid gap-5 sm:grid-cols-3">
            {TRUST.map((item) => (
              <li key={item.title} className="flex gap-3">
                <span className="text-2xl" aria-hidden>
                  {item.icon}
                </span>
                <div>
                  <h3 className="font-semibold text-charcoal">
                    <T k={item.title} />
                  </h3>
                  <p className="mt-0.5 text-sm text-charcoal/70">
                    <T k={item.body} />
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-charcoal/60">
            {settings.openHour === 0 && settings.closeHour === 24 ? (
              <T k="home.hours24" />
            ) : (
              <T k="home.hours" vars={{ open: pad(settings.openHour), close: pad(settings.closeHour) }} />
            )}{" "}
            <Link href="/faq" className="font-semibold text-rose-dark hover:underline">
              <T k="home.faqLink" />
            </Link>
          </p>
        </div>
      </section>

      {/* Shop by occasion */}
      {occasions.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 pt-16">
          <h2 className="font-display text-2xl italic text-charcoal">
            <T k="home.occ.title" />
          </h2>
          <p className="mt-1 max-w-xl text-sm text-charcoal/70">
            <T k="home.occ.sub" />
          </p>
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {occasions.map((o) => (
              <li key={o}>
                <Link
                  href={`/bouquets?occasion=${o}`}
                  className="flex items-center gap-3 rounded-card border border-sand bg-white px-4 py-3.5 text-sm font-medium text-charcoal transition hover:border-rose"
                >
                  <span className="text-xl" aria-hidden>
                    {OCCASION_EMOJI[o]}
                  </span>
                  <T k={`occ.${o}`} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="font-display text-2xl italic text-charcoal">
          <T k="home.how.title" />
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
                  <T k={s.title} />
                </h3>
                <p className="mt-1 text-sm text-charcoal/70">
                  <T k={s.body} />
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Products, grouped */}
      <section className="bg-cream">
        <div className="mx-auto max-w-5xl px-4 py-16">
          {rows.length === 0 ? (
            <p className="text-center text-sm text-charcoal/60">
              <T k="home.empty" />
            </p>
          ) : (
            <div className="space-y-14">
              {rows.map((row) => (
                <div key={row.key}>
                  <div className="flex items-end justify-between gap-4">
                    <h2 className="font-display text-2xl italic text-charcoal">
                      <T k={row.title} />
                    </h2>
                    <Link href={row.href} className="whitespace-nowrap text-sm font-semibold text-rose-dark hover:underline">
                      <T k="home.today.all" />
                    </Link>
                  </div>
                  {row.key === "long" && (
                    <p className="mt-1 text-sm text-charcoal/70">
                      <T k="kind.artificialNote" />
                    </p>
                  )}
                  {row.key === "fresh" && (
                    <p className="mt-1 text-sm text-charcoal/70">
                      <T k="kind.freshNote" />
                    </p>
                  )}
                  <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {row.items.map((b) => (
                      <BouquetCard key={b.id} bouquet={b} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Help choosing */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="flex flex-col gap-4 rounded-card border border-sand bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-xl italic text-charcoal">
              <T k="home.help.title" />
            </h2>
            <p className="mt-1 max-w-md text-sm text-charcoal/70">
              <T k="home.help.body" />
            </p>
          </div>
          <LocalizedWhatsAppButton
            labelKey="home.help.cta"
            message="Hi! I need help choosing flowers. Occasion: ___ · Pickup time: ___ · Budget: Rs. ___"
          />
        </div>
      </section>

      <Reviews />
      <PromiseAbout />

      {/* Meeting near TIA */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="font-display text-2xl italic text-charcoal">
          <T k="home.meet.title" />
        </h2>
        <p className="mt-3 max-w-2xl text-charcoal/70">
          <T k="home.meet.body" />
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/order"
            className="rounded-full bg-charcoal px-6 py-3 text-sm font-semibold text-ivory transition hover:bg-charcoal/80"
          >
            <T k="home.meet.order" />
          </Link>
          <Link
            href="/contact"
            className="rounded-full border border-charcoal/20 px-6 py-3 text-sm font-semibold text-charcoal transition hover:border-charcoal/40"
          >
            <T k="nav.contact" />
          </Link>
        </div>
      </section>
    </div>
  );
}
