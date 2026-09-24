"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLang } from "./LanguageProvider";

export default function ProductCategories() {
  const [categories, setCategories] = useState<string[]>(["Bouquets"]);
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLang();

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        setCategories(data.categories || ["Bouquets"]);
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    }
    loadCategories();
  }, []);

  if (categories.length <= 1) {
    return (
      <Link
        href="/bouquets"
        className="font-body text-sm font-medium text-charcoal transition hover:text-rose"
      >
        {t("nav.bouquets")}
      </Link>
    );
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="font-body text-sm font-medium text-charcoal transition hover:text-rose flex items-center gap-1"
      >
        {t("nav.products")}
        <svg
          className={`h-4 w-4 transition ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-40 rounded-card border border-sand bg-ivory shadow-lg z-50">
          <Link
            href="/bouquets"
            onClick={() => setIsOpen(false)}
            className="block w-full px-4 py-2 text-left text-sm text-charcoal hover:bg-sand/50 first:rounded-t-card"
          >
            {t("cat.allProducts")}
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/bouquets?category=${encodeURIComponent(cat)}`}
              onClick={() => setIsOpen(false)}
              className="block w-full px-4 py-2 text-left text-sm text-charcoal hover:bg-sand/50 last:rounded-b-card"
            >
              {cat}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
