import { Order } from "@/lib/types";

/**
 * Local-development fallback used when MONGODB_URI is not set: orders live in
 * memory and disappear on restart. One shared accessor instead of re-declaring
 * the global in every route file.
 */
declare global {
  // eslint-disable-next-line no-var
  var _mockOrders: Order[] | undefined;
}

export function mockOrders(): Order[] {
  if (!global._mockOrders) global._mockOrders = [];
  return global._mockOrders;
}
