"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";

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
  const [added, setAdded] = useState(false);

  function handleClick(e: React.MouseEvent) {
    // Cards wrap this in a <Link> to the detail page — stop that
    // navigation so clicking "Add to cart" doesn't also open the page.
    e.preventDefault();
    e.stopPropagation();
    if (!available) return;
    addItem(bouquetId, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  if (variant === "full") {
    return (
      <button
        onClick={handleClick}
        disabled={!available}
        className={`mt-6 inline-block rounded-full px-6 py-3 text-sm font-semibold text-ivory transition ${
          available ? "bg-rose hover:bg-rose-dark" : "pointer-events-none bg-charcoal/30"
        }`}
      >
        {!available ? "Currently unavailable" : added ? "Added ✓" : "Add to cart"}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={!available}
      className={`mt-2 w-full rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        !available
          ? "cursor-not-allowed bg-charcoal/10 text-charcoal/40"
          : added
          ? "bg-sage-light text-sage-dark"
          : "bg-rose text-ivory hover:bg-rose-dark"
      }`}
    >
      {!available ? "Sold out" : added ? "Added ✓" : "Add to cart"}
    </button>
  );
}
