import { shopStatus, shopStatusCopy } from "@/lib/data";

const statusStyles: Record<string, string> = {
  OPEN: "bg-sage-light text-sage-dark",
  BUSY: "bg-amber-100 text-amber-800",
  CLOSED: "bg-rose-light text-rose-dark",
};

export default function ShopStatusBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[shopStatus]}`}
      title={shopStatusCopy[shopStatus]}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {compact ? shopStatus : `${shopStatus} — ${shopStatusCopy[shopStatus]}`}
    </span>
  );
}
