import { notFound } from "next/navigation";
import Link from "next/link";
import { getBouquetById } from "@/lib/products";
import AddToCartButton from "@/components/AddToCartButton";

// Bouquets can be added/edited any time from the admin panel, so this page
// is rendered fresh on every request instead of pre-generated at build time.
export const dynamic = "force-dynamic";

export default async function BouquetDetailPage({ params }: { params: { id: string } }) {
  const bouquet = await getBouquetById(params.id);
  if (!bouquet) return notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/bouquets" className="text-sm text-charcoal/60 hover:text-rose-dark">
        ← Back to bouquets
      </Link>

      <div className="mt-4 grid gap-8 sm:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-card border border-sand bg-sand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bouquet.image}
            alt={bouquet.name}
            className="h-full w-full object-cover"
          />
        </div>

        <div>
          <h1 className="font-display text-3xl italic text-charcoal">{bouquet.name}</h1>
          <p className="mt-2 font-mono text-lg font-bold text-rose-dark">
            Rs. {bouquet.price.toLocaleString("en-IN")}
          </p>

          {!bouquet.available && (
            <p className="mt-3 inline-block rounded-full bg-charcoal/10 px-3 py-1 text-xs font-semibold text-charcoal/70">
              Not available today — check back or ask us on WhatsApp
            </p>
          )}

          <p className="mt-4 text-charcoal/70">{bouquet.description}</p>

          {bouquet.customizable && (
            <p className="mt-3 rounded-card bg-sage-light px-4 py-3 text-sm text-sage-dark">
              This bouquet can be customized — flower choice, wrapping color,
              ribbon, or a personal note. You can describe what you want in
              the order form.
            </p>
          )}

          <AddToCartButton bouquetId={bouquet.id} available={bouquet.available} variant="full" />
          {bouquet.available && (
            <p className="mt-2 text-xs text-charcoal/50">
              Added to cart — <Link href="/cart" className="underline hover:text-rose-dark">view cart</Link> when ready to order.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
