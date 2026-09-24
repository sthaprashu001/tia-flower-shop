import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ | TIA Flower Shop",
  description:
    "Answers about ordering, pickup near Tribhuvan International Airport, lead times, customizing bouquets and payment.",
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
