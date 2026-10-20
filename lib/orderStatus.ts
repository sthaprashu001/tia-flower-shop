import type { OrderStatus } from "./types";

/**
 * Which status changes an admin may make. Stops accidents like moving a
 * delivered order back to "pending", and keeps the order history trustworthy.
 *
 * Pure data + functions (no server imports) so the admin UI uses the same
 * rules as the API.
 */
export const STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "REJECTED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "READY", "CANCELLED"],
  PREPARING: ["READY", "CONFIRMED", "CANCELLED"],
  READY: ["DELIVERED", "PREPARING", "CANCELLED"],
  DELIVERED: ["READY"], // undo a mis-tap
  CANCELLED: ["PENDING"], // undo a mis-tap (slot capacity is re-checked)
  REJECTED: ["PENDING"],
};

/** Statuses that free up the pickup slot. */
export const SLOT_FREEING: OrderStatus[] = ["CANCELLED", "REJECTED"];

/** Only dead orders may be permanently deleted; delivered ones are kept for sales history. */
export const DELETABLE: OrderStatus[] = ["CANCELLED", "REJECTED"];

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return STATUS_FLOW[from]?.includes(to) ?? false;
}

export function isSlotFreeing(status: OrderStatus): boolean {
  return SLOT_FREEING.includes(status);
}
