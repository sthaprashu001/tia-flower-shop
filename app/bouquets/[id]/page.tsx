import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { getBouquetById } from "@/lib/products";
import AddToCartButton from "@/components/AddToCartButton";
import LeadTimeNote from "@/components/LeadTimeNote";
import T from "@/components/T";

// Bouquets can be added/edited any time from the admin panel, so this page
// is rendered fresh on every request instead of pre-generated at build time.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const bouquet = await getBouquetById(params.id);
  if (!bouquet) return {};

  const description = bouquet.description
    ? `${bouquet.description} Fresh, delivered near Tribhuvan International Airport, Kathmandu.`
    : `${bouquet.name} — fresh bouquet delivered near Tribhuvan International Airport, Kathmandu.`;

  return {
    title: `${bouquet.name} — Rs. ${bouquet.price}`,
    description,
    openGraph: {
      title: `${bouquet.name} | TIA Flower Shop`,
      description,
      images: bouquet.image ? [{ url: bouquet.image }] : undefined,
    },
  };
}

export default async function BouquetDetailPage({ params }: { params: { id: string } }) {
  const bouquet = await getBouquetById(params.id);
  if (!bouquet) return notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/bouquets" className="text-sm text-charcoal/60 hover:text-rose-dark">
        <T k="detail.back" />
      </Link>

      <div className="mt-4 grid gap-8 sm:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-card border border-sand bg-sand">
          <Image
            src={bouquet.image}
            alt={`${bouquet.name} — fresh bouquet delivery near TIA, Kathmandu`}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        </div>

        <div>
          <h1 className="font-display text-3xl italic text-charcoal">{bouquet.name}</h1>
          <p className="mt-2 font-mono text-lg font-bold text-rose-dark">
            Rs. {bouquet.price.toLocaleString("en-IN")}
          </p>

          {!bouquet.available && (
            <p className="mt-3 inline-block rounded-full bg-charcoal/10 px-3 py-1 text-xs font-semibold text-charcoal/70">
              <T k="detail.notAvailable" />
            </p>
          )}

          <p className="mt-4 text-charcoal/70">{bouquet.description}</p>

          {(bouquet.leadTimeHours || 0) > 0 && (
            <p className="mt-3 rounded-card bg-amber-50 px-4 py-3 text-sm text-amber-900">
              ⏰ <LeadTimeNote hours={bouquet.leadTimeHours || 0} k="detail.leadNotice" />
            </p>
          )}

          {bouquet.customizable && (
            <p className="mt-3 rounded-card bg-sage-light px-4 py-3 text-sm text-sage-dark">
              <T k="detail.customizable" />
            </p>
          )}

          <AddToCartButton bouquetId={bouquet.id} available={bouquet.available} variant="full" />
          {bouquet.available && (
            <p className="mt-2 text-xs text-charcoal/50">
              <T k="detail.addedTo" /> <Link href="/cart" className="underline hover:text-rose-dark"><T k="detail.viewCart" /></Link> <T k="detail.whenReady" />
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
