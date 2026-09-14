import type { Metadata } from "next";
import { Fraunces, Inter, Space_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import { CartProvider } from "@/components/CartProvider";
import { siteUrl } from "@/lib/site";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "TIA Flower Shop | Bouquets near Tribhuvan International Airport",
    template: "%s | TIA Flower Shop",
  },
  description:
    "Order fresh bouquets for arrivals and departures near TIA, Kathmandu. Choose your flowers online, we prepare and meet you at the airport.",
  keywords: [
    "flower shop near TIA",
    "flowers Tribhuvan Airport",
    "bouquet delivery Kathmandu",
    "fresh flowers Kathmandu",
    "airport flowers Nepal",
  ],
  openGraph: {
    title: "TIA Flower Shop | Fresh Bouquets Near the Airport",
    description:
      "Welcome or say goodbye with fresh flowers, delivered near TIA, Kathmandu.",
    url: siteUrl,
    siteName: "TIA Flower Shop",
    type: "website",
    locale: "en_NP",
    images: [{ url: "/images/red-rose-black-cover.jpeg", width: 1200, height: 900 }],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const sameAs = [
    process.env.NEXT_PUBLIC_INSTAGRAM_URL,
    process.env.NEXT_PUBLIC_FACEBOOK_URL,
    process.env.NEXT_PUBLIC_TIKTOK_URL,
  ].filter((url): url is string => Boolean(url));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "TIA Flower Shop",
    description:
      "Fresh bouquet delivery near Tribhuvan International Airport, Kathmandu, Nepal.",
    url: siteUrl,
    image: `${siteUrl}/images/red-rose-black-cover.jpeg`,
    ...(whatsappNumber ? { telephone: `+${whatsappNumber}` } : {}),
    // No fixed street address is on file yet — add NEXT_PUBLIC_SHOP_ADDRESS
    // (or fill this in directly) once you have one to publish; an address
    // meaningfully improves local search ranking.
    areaServed: { "@type": "City", name: "Kathmandu" },
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${spaceMono.variable}`}>
      <body className="font-body flex min-h-screen flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <SessionProviderWrapper>
          <CartProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <WhatsAppButton floating />
          </CartProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
