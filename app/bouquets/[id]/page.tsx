import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { getBouquetById } from "@/lib/products";
import { productImages, productKind, productNoun } from "@/lib/types";
import { siteUrl } from "@/lib/site";
import AddToCartButton from "@/components/AddToCartButton";
import LeadTimeNote from "@/components/LeadTimeNote";
import ProductGallery from "@/components/ProductGallery";
import { KindBadge, OccasionTags } from "@/components/ProductLabels";
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

  const kind = productKind(bouquet);
  // Say "fresh" only for fresh flowers — never for artificial products.
  const tail =
    kind === "fresh"
      ? "Fresh flowers, handed over near Tribhuvan International Airport, Kathmandu."
      : kind === "artificial"
      ? "Long-lasting artificial flowers, handed over near Tribhuvan International Airport, Kathmandu."
      : "Handed over near Tribhuvan International Airport, Kathmandu.";
  const description = bouquet.description ? `${bouquet.description} ${tail}` : `${bouquet.name}. ${tail}`;
  const images = productImages(bouquet);

  return {
    title: `${bouquet.name} — Rs. ${bouquet.price}`,
    description,
    openGraph: {
      title: `${bouquet.name} | TIA Flower Shop`,
      description,
      images: images.length ? images.slice(0, 4).map((url) => ({ url })) : undefined,
    },
  };
}

export default async function BouquetDetailPage({ params }: { params: { id: string } }) {
  const bouquet = await getBouquetById(params.id);
  if (!bouquet) return notFound();

  const images = productImages(bouquet);
  const kind = productKind(bouquet);

  // Product rich-result: lets this bouquet show its price (and stock status)
  // directly in Google search results, not just as a plain blue link.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: bouquet.name,
    description: bouquet.description || `${bouquet.name} — ${productNoun(bouquet)} near TIA, Kathmandu.`,
    image: images.length ? images.map((src) => new URL(src, siteUrl).toString()) : undefined,
    category: bouquet.category,
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/bouquets/${bouquet.id}`,
      priceCurrency: "NPR",
      price: bouquet.price,
      availability: bouquet.available
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <script
        type="application/ld+json"
        // JSON.stringify never emits "<" from these fields, but escaped defensively
        // in case a future admin-entered name/description ever contains it.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Link href="/bouquets" className="text-sm text-charcoal/60 hover:text-rose-dark">
        <T k="detail.back" />
      </Link>

      <div className="mt-4 grid gap-8 sm:grid-cols-2">
        <ProductGallery images={images} alt={`${bouquet.name} — ${productNoun(bouquet)} for pickup near TIA, Kathmandu`} />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <KindBadge kind={kind} />
          </div>
          <h1 className="mt-2 font-display text-3xl italic text-charcoal">{bouquet.name}</h1>
          <p className="mt-2 font-mono text-lg font-bold text-rose-dark">
            Rs. {bouquet.price.toLocaleString("en-IN")}
          </p>
          {bouquet.sizeNote && <p className="mt-1 text-sm font-medium text-charcoal/70">{bouquet.sizeNote}</p>}

          {!bouquet.available && (
            <p className="mt-3 inline-block rounded-full bg-charcoal/10 px-3 py-1 text-xs font-semibold text-charcoal/70">
              <T k="detail.notAvailable" />
            </p>
          )}

          <p className="mt-4 text-charcoal/70">{bouquet.description}</p>

          {kind === "artificial" && (
            <p className="mt-3 rounded-card bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <T k="kind.artificialNote" />
            </p>
          )}
          {kind === "fresh" && (
            <p className="mt-3 rounded-card bg-sage-light px-4 py-3 text-sm text-sage-dark">
              <T k="kind.freshNote" />
            </p>
          )}

          <OccasionTags tags={bouquet.tags} />

          {(bouquet.leadTimeMinutes || 0) > 0 && (
            <p className="mt-3 rounded-card bg-amber-50 px-4 py-3 text-sm text-amber-900">
              ⏰ <LeadTimeNote minutes={bouquet.leadTimeMinutes || 0} k="detail.leadNotice" />
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

          <p className="mt-6 border-t border-sand pt-4 text-sm text-charcoal/70">
            <span className="font-medium text-charcoal"><T k="home.promise.title" />.</span> <T k="home.promise.body" />
          </p>
        </div>
      </div>
    </div>
  );
}
