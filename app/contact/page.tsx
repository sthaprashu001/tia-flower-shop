import { Metadata } from "next";
import WhatsAppButton from "@/components/WhatsAppButton";

export const metadata: Metadata = {
  title: "Contact | TIA Flower Shop",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="font-display text-3xl italic text-charcoal">Contact us</h1>
      <p className="mt-2 text-charcoal/70">
        The quickest way to reach us is WhatsApp — for order changes,
        custom requests, or urgent bouquets.
      </p>

      <div className="mt-8 space-y-4">
        <div className="rounded-card border border-sand bg-white p-5">
          <h2 className="font-display text-lg text-charcoal">WhatsApp</h2>
          <p className="mt-1 text-sm text-charcoal/70">
            Fastest response, especially near your pickup time.
          </p>
          <div className="mt-3">
            <WhatsAppButton />
          </div>
        </div>

        <div className="rounded-card border border-sand bg-white p-5">
          <h2 className="font-display text-lg text-charcoal">Near TIA</h2>
          <p className="mt-1 text-sm text-charcoal/70">
            Bouquets are prepared about 2 minutes' walk from Tribhuvan
            International Airport. We meet customers near the terminal —
            never inside restricted airport areas. The exact spot is
            confirmed on WhatsApp for every order.
          </p>
        </div>

        <div className="rounded-card border border-sand bg-white p-5">
          <h2 className="font-display text-lg text-charcoal">Follow us</h2>
          <p className="mt-1 text-sm text-charcoal/70">
            Daily bouquets and prices are posted on TikTok, Instagram and
            Facebook — links in the footer below.
          </p>
        </div>
      </div>
    </div>
  );
}
