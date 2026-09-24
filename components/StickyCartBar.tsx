"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./CartProvider";
import { useLang } from "./LanguageProvider";

/**
 * Phone-only bar pinned to the bottom of the screen while the cart has items,
 * so customers never have to scroll back up to find checkout.
 */
export default function StickyCartBar() {
  const { count, hydrated } = useCart();
  const { t } = useLang();
  const pathname = usePathname();

  const hidden =
    !hydrated ||
    count === 0 ||
    pathname.startsWith("/cart") ||
    pathname.startsWith("/order") ||
    pathname.startsWith("/admin");
  if (hidden) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-sand bg-ivory/95 px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur sm:hidden">
      <Link
        href="/cart"
        className="flex items-center justify-between rounded-full bg-rose px-5 py-3 text-sm font-semibold text-ivory transition hover:bg-rose-dark"
      >
        <span>{t("sticky.viewCart")}</span>
        <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs">{t("sticky.items", { n: count })}</span>
      </Link>
    </div>
  );
}
