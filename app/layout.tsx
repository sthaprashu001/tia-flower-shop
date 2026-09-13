import type { Metadata } from "next";
import { Fraunces, Inter, Space_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";

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
  title: "TIA Flower Shop | Bouquets near Tribhuvan International Airport",
  description:
    "Order fresh bouquets for arrivals and departures near TIA, Kathmandu. Choose your flowers online, we prepare and meet you at the airport.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${spaceMono.variable}`}>
      <body className="font-body flex min-h-screen flex-col">
        <SessionProviderWrapper>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <WhatsAppButton floating />
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
