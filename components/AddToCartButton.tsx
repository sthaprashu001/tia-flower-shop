"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";
import { useLang } from "./LanguageProvider";

/**
 * "compact" = one clean button for product cards (quantity can be changed in
 * the cart or on the product page). "full" = quantity stepper + button for the
 * product page.
 */
export default function AddToCartButton({
  bouquetId,
  available,
  variant = "compact",
}: {
  bouquetId: string;
  available: boolean;
  variant?: "compact" | "full";
}) {
  const { addItem } = useCart();
  const { t } = useLang();
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);

  function handleClick(e: React.MouseEvent) {
    // Cards wrap this in a <Link> to the detail page — stop that
    // navigation so clicking "Add to cart" doesn't also open the page.
    e.preventDefault();
    e.stopPropagation();
    if (!available) return;
    addItem(bouquetId, variant === "full" ? quantity : 1);
    setAdded(true);
    setQuantity(1);
    setTimeout(() => setAdded(false), 1500);
  }

  function handleQuantityChange(e: React.MouseEvent, delta: number) {
    e.preventDefault();
    e.stopPropagation();
    const newQty = quantity + delta;
    if (newQty > 0) setQuantity(newQty);
  }

  if (variant === "full") {
    return (
      <div className="mt-6 flex items-center gap-2">
        {!added && available && (
          <div className="flex items-center rounded-full border border-charcoal/20">
            <button
              type="button"
              onClick={(e) => handleQuantityChange(e, -1)}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
              className="px-3 py-2 text-charcoal/40 hover:text-charcoal disabled:opacity-50"
            >
              −
            </button>
            <input
              type="number"
              min="1"
              value={quantity}
              aria-label="Quantity"
              onChange={(e) => {
                const val = Math.max(1, parseInt(e.target.value) || 1);
                setQuantity(val);
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-10 border-0 bg-transparent text-center text-sm font-semibold text-charcoal"
            />
            <button
              type="button"
              onClick={(e) => handleQuantityChange(e, 1)}
              aria-label="Increase quantity"
              className="px-3 py-2 text-charcoal hover:text-charcoal/60"
            >
              +
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={handleClick}
          disabled={!available}
          className={`flex-1 inline-block rounded-full px-6 py-3 text-sm font-semibold text-ivory transition ${
            available ? "bg-rose hover:bg-rose-dark" : "pointer-events-none bg-charcoal/30"
          }`}
        >
          {!available ? t("btn.unavailable") : added ? t("btn.added") : t("btn.add")}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!available}
      className={`mt-3 w-full rounded-full px-3 py-2 text-xs font-semibold transition ${
        !available
          ? "cursor-not-allowed bg-charcoal/10 text-charcoal/40"
          : added
          ? "bg-sage-light text-sage-dark"
          : "bg-rose text-ivory hover:bg-rose-dark"
      }`}
    >
      {!available ? t("btn.soldOut") : added ? t("btn.added") : t("btn.add")}
    </button>
  );
}
