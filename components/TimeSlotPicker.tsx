"use client";

import { buildSlots, pickupInstantMs } from "@/lib/time";
import { useLang } from "./LanguageProvider";

/**
 * Pickup-time buttons instead of a free-typing time box. Only slots inside
 * opening hours are shown; slots that are already fully booked, or too soon
 * for the items in the cart (minimum notice), are greyed out.
 */
export default function TimeSlotPicker({
  date,
  value,
  onChange,
  openHour,
  closeHour,
  capacityPerHour,
  counts,
  earliestMs,
  loading,
}: {
  date: string;
  value: string;
  onChange: (time: string) => void;
  openHour: number;
  closeHour: number;
  capacityPerHour: number;
  counts: Record<string, number>;
  earliestMs: number;
  loading: boolean;
}) {
  const { t } = useLang();

  if (!date) {
    return <p className="text-sm text-charcoal/60">{t("order.pickDateFirst")}</p>;
  }

  const slots = buildSlots(openHour, closeHour);
  const fullHour = (time: string) => (counts[time.slice(0, 2)] || 0) >= capacityPerHour;
  const tooSoon = (time: string) => pickupInstantMs(date, time) < earliestMs;
  const anyFree = slots.some((s) => !fullHour(s) && !tooSoon(s));

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="radiogroup" aria-label={t("order.time")}>
        {slots.map((time) => {
          const full = fullHour(time);
          const soon = tooSoon(time);
          const disabled = full || soon;
          const selected = value === time;
          return (
            <button
              key={time}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(time)}
              title={full ? t("order.slotFull") : soon ? t("order.slotTooSoon") : undefined}
              className={`rounded-md border px-2 py-2 text-sm font-medium transition ${
                selected
                  ? "border-rose bg-rose text-ivory"
                  : disabled
                  ? "cursor-not-allowed border-sand bg-sand/30 text-charcoal/30 line-through"
                  : "border-sand bg-white text-charcoal hover:border-rose"
              }`}
            >
              {time}
              {full && <span className="block text-[10px] font-normal no-underline">{t("order.slotFull")}</span>}
            </button>
          );
        })}
      </div>
      {loading && <p className="mt-2 text-xs text-charcoal/50">{t("order.loadingTimes")}</p>}
      {!loading && !anyFree && (
        <p className="mt-2 text-sm text-rose-dark">{t("order.noSlots")}</p>
      )}
    </div>
  );
}
