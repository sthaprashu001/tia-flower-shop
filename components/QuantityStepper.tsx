"use client";

import { useLang } from "./LanguageProvider";

/** − / + buttons around the quantity: one tap on a phone instead of typing. */
export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 50,
  label,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  label?: string;
}) {
  const { t } = useLang();
  const clamp = (n: number) => Math.min(max, Math.max(min, Number.isFinite(n) ? Math.floor(n) : min));

  return (
    <div className="flex items-center rounded-full border border-sand bg-white" role="group" aria-label={label}>
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= min}
        aria-label={t("order.decrease")}
        className="h-9 w-9 text-lg text-charcoal transition hover:text-rose-dark disabled:text-charcoal/25"
      >
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        aria-label={label}
        className="w-9 border-0 bg-transparent p-0 text-center text-sm font-semibold text-charcoal [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        aria-label={t("order.increase")}
        className="h-9 w-9 text-lg text-charcoal transition hover:text-rose-dark disabled:text-charcoal/25"
      >
        +
      </button>
    </div>
  );
}
