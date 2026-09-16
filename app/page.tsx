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
  { title: "Meet & receive", body: "We hand it to you near TIA. Free, no delivery cost." },
];

export default async function HomePage() {
  const bouquets = await getAllBouquets();
  
  // Get featured items - filter for products with featured flag set to true
  const featured = bouquets
    .filter((b) => b.featured === true)
    .sort((a, b) => (a.featuredOrder || 0) - (b.featuredOrder || 0));
  
  console.log("DEBUG: Total bouquets:", bouquets.length);
  console.log("DEBUG: Featured bouquets:", featured.length);
  console.log("DEBUG: Featured items:", featured.map(b => ({ name: b.name, featured: b.featured, order: b.featuredOrder })));
  
  // Separate bouquets from other categories
  const featuredBouquets = featured.filter((b) => b.category === "Bouquets");
  const featuredOthers = featured.filter((b) => b.category !== "Bouquets");
  
  // Arrange with bouquets in middle (positions 2, 3, 4 out of 0-6)
  // Layout: [Other1, Other2, Bouquet1, Bouquet2, Bouquet3, Other3, Other4]
  const collage = [
    featuredOthers[0],
    featuredOthers[1],
    featuredBouquets[0],
    featuredBouquets[1],
    featuredBouquets[2],
    featuredOthers[2],
    featuredOthers[3],
  ].filter(Boolean); // Remove undefined items
  
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

          {collage.length > 0 ? (
            <div className="relative mx-auto w-full max-w-xs lg:mx-0 lg:max-w-none h-60 sm:h-80 lg:h-96">
              {collage.map((item, idx) => {
                const positions = [
                  "left-0 top-10 -rotate-6 z-10",
                  "left-1/4 top-0 rotate-3 z-20",
                  "left-1/2 top-8 z-30",
                  "right-1/4 top-0 -rotate-3 z-20",
                  "right-0 top-10 rotate-6 z-10",
                ];
                return (
                  <div
                    key={item.id}
                    className={`absolute h-40 w-32 overflow-hidden rounded-lg shadow-lg transition-all hover:shadow-xl hover:z-50 sm:h-48 sm:w-40 lg:h-56 lg:w-44 ${positions[idx] || positions[0]}`}
                  >
                    <div className="h-full w-full bg-white flex flex-col">
                      <div className="relative h-32 w-full bg-sand/30 sm:h-40 lg:h-44">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="176px"
                          priority={idx < 2}
                        />
                      </div>
                      <div className="flex-1 p-2 flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] font-medium text-charcoal/60">
                            {item.category || "Bouquets"}
                          </p>
                          <h3 className="line-clamp-1 text-xs font-semibold text-charcoal">
                            {item.name}
                          </h3>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-rose-dark mb-1">
                            Rs. {item.price}
                          </p>
                          <button className="w-full bg-rose text-white text-[10px] py-1 rounded-full hover:bg-rose-dark transition">
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-8 rounded-lg border border-sand/30 bg-sand/10 p-8 text-center">
              <p className="text-sm text-charcoal/60">Featured products coming soon. Mark products as featured in admin panel.</p>
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
            <h2 className="font-display text-2xl italic text-charcoal">Today's items</h2>
            <Link href="/bouquets" className="text-sm font-semibold text-rose-dark hover:underline">
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
