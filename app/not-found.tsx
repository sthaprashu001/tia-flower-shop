import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-charcoal/50">404</p>
      <h1 className="mt-2 font-display text-3xl italic text-charcoal">Page not found</h1>
      <p className="mt-3 text-charcoal/70">
        That page doesn't exist — but the bouquets do.
      </p>
      <Link
        href="/bouquets"
        className="mt-6 inline-block rounded-full bg-rose px-6 py-3 text-sm font-semibold text-ivory hover:bg-rose-dark"
      >
        See bouquets
      </Link>
    </div>
  );
}
