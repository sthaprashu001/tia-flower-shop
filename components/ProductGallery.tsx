"use client";

import { useRef, useState } from "react";
import Image from "next/image";

/**
 * Product detail slider: swipe on phones, arrow buttons / arrow keys on
 * desktop, dots and a thumbnail strip. With one photo it shows just the photo.
 */
export default function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const startX = useRef<number | null>(null);
  const n = images.length;

  if (n === 0) {
    return <div className="relative aspect-square overflow-hidden rounded-card border border-sand bg-sand" />;
  }

  const go = (delta: number) => setIndex((i) => (i + delta + n) % n);

  function onTouchEnd(e: React.TouchEvent) {
    if (startX.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
  }

  return (
    <div>
      <div
        className="group relative aspect-square overflow-hidden rounded-card border border-sand bg-sand outline-none"
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label={alt}
        onKeyDown={(e) => {
          if (n < 2) return;
          if (e.key === "ArrowLeft") go(-1);
          if (e.key === "ArrowRight") go(1);
        }}
        onTouchStart={(e) => (startX.current = e.touches[0].clientX)}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {images.map((src, i) => (
            <div key={src + i} className="relative h-full w-full shrink-0">
              <Image
                src={src}
                alt={`${alt} — photo ${i + 1} of ${n}`}
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover"
                priority={i === 0}
              />
            </div>
          ))}
        </div>

        {n > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-lg text-charcoal shadow hover:bg-white"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-lg text-charcoal shadow hover:bg-white"
            >
              ›
            </button>
            <span className="absolute right-2 top-2 rounded-full bg-charcoal/70 px-2.5 py-1 font-mono text-[10px] text-ivory">
              {index + 1} / {n}
            </span>
            <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Show photo ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${i === index ? "w-5 bg-white" : "w-2 bg-white/60"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {n > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === index}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition ${
                i === index ? "border-rose" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={src} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
