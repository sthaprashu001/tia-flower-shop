import type { Metadata } from "next";
import { Fraunces, Inter, Space_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import { CartProvider } from "@/components/CartProvider";
import { LanguageProvider } from "@/components/LanguageProvider";
import StickyCartBar from "@/components/StickyCartBar";
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
    default:
      "TIA Flower Shop | Fresh Flowers & Bouquets near Kathmandu Airport",
    template: "%s | TIA Flower Shop",
  },
  description:
    "Best flower shop near Tribhuvan International Airport Kathmandu. Fresh bouquets for arrivals, departures & special occasions. Same-day delivery available.",
  keywords: [
    "flower shop near TIA",
    "flower shop Kathmandu",
    "flower shop airport",
    "flower shop ktm airport",
    "bouquet shop near tia",
    "flowers Tribhuvan Airport",
    "flower delivery airport Kathmandu",
    "fresh flowers Nepal",
    "bouquet delivery Kathmandu",
    "flowers near airport ktm",
    "khata flags Kathmandu",
    "gifts near TIA",
  ],

  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "TIA Flower Shop | Fresh Bouquets Near the Airport",
    description:
      "Welcome or say goodbye with fresh flowers, delivered near TIA, Kathmandu.",
    url: siteUrl,
    siteName: "TIA Flower Shop",
    type: "website",
    locale: "en_NP",
    images: [
      {
        url: "/logo/tia-logo.jpeg",
        width: 1024,
        height: 1024,
        alt: "TIA Flower Shop Logo",
      },
      { url: "/images/red-rose-black-cover.jpeg", width: 1200, height: 900 },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  ...(process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION
    ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION } }
    : {}),
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

  const address =
    process.env.NEXT_PUBLIC_SHOP_ADDRESS ||
    "Near Tribhuvan International Airport, Kathmandu, Nepal";
  const latitude = process.env.NEXT_PUBLIC_SHOP_LATITUDE || "27.8176";
  const longitude = process.env.NEXT_PUBLIC_SHOP_LONGITUDE || "85.9124";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": siteUrl,
    name: "TIA Flower Shop",
    description:
      "Fresh bouquet delivery near Tribhuvan International Airport, Kathmandu, Nepal. Specializing in bouquets, khata, and flags.",
    url: siteUrl,
    logo: `${siteUrl}/logo/tia-logo.jpeg`,
    image: `${siteUrl}/images/red-rose-black-cover.jpeg`,
    ...(whatsappNumber ? { telephone: `+${whatsappNumber}` } : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: "Kathmandu",
      addressRegion: "Bagmati",
      addressCountry: "NP",
      streetAddress: address,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
    },
    areaServed: { "@type": "City", name: "Kathmandu" },
    priceRange: "Rs. 70 - Rs. 1000",
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${spaceMono.variable}`}
    >
      <body className="font-body flex min-h-screen flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
        <SessionProviderWrapper>
          <LanguageProvider>
            <CartProvider>
              <Navbar />
              <main className="flex-1 pb-16 sm:pb-0">{children}</main>
              <Footer />
              <WhatsAppButton floating />
              <StickyCartBar />
            </CartProvider>
          </LanguageProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
