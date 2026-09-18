import Link from "next/link";
import Image from "next/image";
import ShopStatusBadge from "./ShopStatusBadge";
import CartIcon from "./CartIcon";
import ProductCategories from "./ProductCategories";

const links = [
  { href: "/order", label: "Order" },
  { href: "/order-status", label: "Track Order" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-sand bg-ivory/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="transition hover:opacity-80">
          <Image
            src="/logo/tia-logo.jpeg"
            alt="TIA Flower Shop"
            width={50}
            height={50}
            priority
            className="h-12 w-auto rounded-lg"
          />
        </Link>

        <nav className="hidden gap-6 sm:flex">
          <ProductCategories />
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-body text-sm font-medium text-charcoal transition hover:text-rose"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ShopStatusBadge compact />
          <CartIcon />
          <Link
            href="/order"
            className="hidden rounded-full bg-rose px-4 py-2 text-sm font-semibold text-ivory transition hover:bg-rose-dark sm:inline-block"
          >
            Order now
          </Link>
        </div>
      </div>

      {/* mobile nav row */}
      <nav className="flex gap-4 overflow-x-auto border-t border-sand px-4 py-2 sm:hidden">
        <Link
          href="/bouquets"
          className="whitespace-nowrap text-sm font-medium text-charcoal hover:text-rose"
        >
          Products
        </Link>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="whitespace-nowrap text-sm font-medium text-charcoal hover:text-rose"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
