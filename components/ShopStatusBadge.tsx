import { getShopSettings } from "@/lib/shopSettings";
import { shopStatusCopy } from "@/lib/data";

const statusStyles: Record<string, string> = {
  OPEN: "bg-sage-light text-sage-dark",
  BUSY: "bg-amber-100 text-amber-800",
  CLOSED: "bg-rose-light text-rose-dark",
};

// Reads live from the database (Phase 4) — editable from the admin
// dashboard's "Shop settings" section, no redeploy needed. Falls back to
// NEXT_PUBLIC_SHOP_STATUS if no database is connected.
export default async function ShopStatusBadge({ compact = false }: { compact?: boolean }) {
  const { status } = await getShopSettings();

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}
      title={shopStatusCopy[status]}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {compact ? status : `${status} — ${shopStatusCopy[status]}`}
    </span>
  );
}
