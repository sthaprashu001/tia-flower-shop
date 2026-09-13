import Link from "next/link";
import BouquetCard from "@/components/BouquetCard";
import ShopStatusBadge from "@/components/ShopStatusBadge";
import WhatsAppButton from "@/components/WhatsAppButton";
import { getAllBouquets } from "@/lib/products";

export const dynamic = "force-dynamic";

const STEPS = [
  { time: "01", title: "Browse", body: "See today's available bouquets and prices." },
  { time: "02", title: "Choose a time", body: "Pick when you'll be near TIA — arrival or departure." },
  { time: "03", title: "We prepare", body: "Your bouquet is made fresh, ~2 minutes from the terminal." },
  { time: "04", title: "Meet & receive", body: "We hand it to you near TIA. Free, no detour needed." },
];

export default async function HomePage() {
  const bouquets = await getAllBouquets();
  const available = bouquets.filter((b) => b.available).slice(0, 4);

  return (
    <div>
      {/* Hero — departure board motif */}
      <section className="border-b border-sand bg-board text-ivory">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:py-20">
          <div className="mb-4 flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-widest text-ivory/50">
              TIa · Kathmandu, Nepal
            </span>
            <ShopStatusBadge />
          </div>

          <h1 className="max-w-2xl font-display text-4xl italic leading-tight sm:text-5xl">
            For every hello, goodbye, and journey.
          </h1>
          <p className="mt-4 max-w-lg text-ivory/75">
            Sending someone abroad or welcoming them home? We’ll prepare fresh flowers for your special moment and have them ready near TIA when you need them.
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
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="font-display text-2xl italic text-charcoal">How ordering works</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.time} className="rounded-card border border-sand bg-white p-5">
              <span className="font-mono text-xs text-rose-dark">{s.time}</span>
              <h3 className="mt-2 font-display text-lg text-charcoal">{s.title}</h3>
              <p className="mt-1 text-sm text-charcoal/70">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Today's bouquets */}
      <section className="mx-auto max-w-5xl px-4 py-14">
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
      </section>

      {/* TIA info */}
      <section className="border-t border-sand bg-sand/40">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <h2 className="font-display text-2xl italic text-charcoal">Meeting you near TIA</h2>
          <p className="mt-3 max-w-2xl text-charcoal/70">
            We prepare every bouquet about two minutes' walk from Tribhuvan
            International Airport, and hand it to you near the terminal —
            free of charge. Tell us your preferred meeting point, date and
            time when you order, and we'll confirm the exact spot on
            WhatsApp. Please allow at least 30–60 minutes' notice so we can
            prepare it fresh.
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
        </div>
      </section>
    </div>
  );
}
