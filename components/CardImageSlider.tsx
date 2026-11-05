"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * Small slider for product cards. The card is wrapped in a <Link>, so the
 * arrow/dot buttons stop the click from opening the product page.
 */
export default function CardImageSlider({
  images,
  alt,
  sizes,
}: {
  images: string[];
  alt: string;
  sizes: string;
}) {
  const [index, setIndex] = useState(0);
  const n = images.length;
  if (n === 0) return null;

  const stop = (e: React.MouseEvent, fn: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    fn();
  };

  return (
    <>
      <Image
        src={images[index]}
        alt={`${alt}${n > 1 ? ` — photo ${index + 1} of ${n}` : ""}`}
        fill
        sizes={sizes}
        className="object-cover transition group-hover:scale-105"
        priority={false}
      />
      {n > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={(e) => stop(e, () => setIndex((i) => (i - 1 + n) % n))}
            className="absolute left-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-base text-charcoal shadow hover:bg-white"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={(e) => stop(e, () => setIndex((i) => (i + 1) % n))}
            className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-base text-charcoal shadow hover:bg-white"
          >
            ›
          </button>
          <div className="absolute inset-x-0 bottom-1.5 flex justify-center gap-1">
            {images.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === index ? "w-4 bg-white" : "w-1.5 bg-white/60"}`}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
