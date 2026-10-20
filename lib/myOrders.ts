/**
 * Orders placed from this device, remembered in localStorage so the customer
 * can track them in one tap without retyping the order number. Stored only on
 * the customer's own phone; the server never lists orders by phone number.
 */
export interface MyOrder {
  orderNumber: string;
  phone: string;
  date: string;
  time: string;
}

const KEY = "tia-my-orders";
const MAX = 5;

export function loadMyOrders(): MyOrder[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((o) => o && typeof o.orderNumber === "string" && typeof o.phone === "string")
      .slice(0, MAX);
  } catch {
    return [];
  }
}

export function saveMyOrder(order: MyOrder): void {
  try {
    const rest = loadMyOrders().filter((o) => o.orderNumber !== order.orderNumber);
    localStorage.setItem(KEY, JSON.stringify([order, ...rest].slice(0, MAX)));
  } catch {
    // Storage unavailable — tracking by typing the number still works.
  }
}
