import { redirect } from "next/navigation";

// The old "look up by phone number only" page was removed: it let anyone who
// knew a phone number read that person's orders. Tracking now needs the order
// number as well (and remembers recent orders on the customer's own device).
export default function OrderStatusRedirect() {
  redirect("/track-order");
}
