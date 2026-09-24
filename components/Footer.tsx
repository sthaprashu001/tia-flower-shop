import Link from "next/link";
import WhatsAppButton from "./WhatsAppButton";

// Set these in Vercel → Settings → Environment Variables (no code changes
// needed). Any link left blank simply won't show up in the footer.
const SOCIALS = [
  { label: "TikTok", href: process.env.NEXT_PUBLIC_TIKTOK_URL },
  { label: "Instagram", href: process.env.NEXT_PUBLIC_INSTAGRAM_URL },
  { label: "Facebook", href: process.env.NEXT_PUBLIC_FACEBOOK_URL },
].filter((s): s is { label: string; href: string } => Boolean(s.href));

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-sand bg-board text-ivory">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="font-display text-lg italic">TIA Flower Shop</p>
          <p className="mt-2 text-sm text-ivory/70">
            Fresh bouquets, prepared near Tribhuvan International Airport,
            Kathmandu. Order ahead, meet us near the terminal.
          </p>
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-ivory/50">
            Site
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/bouquets" className="hover:text-rose-light">Bouquets</Link></li>
            <li><Link href="/order" className="hover:text-rose-light">Place an order</Link></li>
            <li><Link href="/faq" className="hover:text-rose-light">FAQ</Link></li>
            <li><Link href="/contact" className="hover:text-rose-light">Contact</Link></li>
            <li><Link href="/admin/login" className="hover:text-rose-light">Admin</Link></li>
          </ul>
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-ivory/50">
            Follow &amp; chat
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {SOCIALS.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="hover:text-rose-light">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <WhatsAppButton />
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-4 text-center font-mono text-xs text-ivory/40">
        © {new Date().getFullYear()} TIA Flower Shop · Kathmandu, Nepal
      </div>
    </footer>
  );
}
