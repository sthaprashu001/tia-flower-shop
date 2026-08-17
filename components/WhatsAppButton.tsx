const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "97700000000";

export default function WhatsAppButton({
  floating = false,
  message = "Hi! I'd like to ask about a bouquet.",
  label = "Chat on WhatsApp",
}: {
  floating?: boolean;
  message?: string;
  label?: string;
}) {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  if (floating) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-sage px-4 py-3 text-sm font-semibold text-ivory shadow-lg transition hover:bg-sage-dark sm:bottom-6 sm:right-6"
      >
        <span aria-hidden>💬</span>
        <span className="hidden sm:inline">WhatsApp</span>
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full bg-sage px-5 py-2.5 text-sm font-semibold text-ivory transition hover:bg-sage-dark"
    >
      <span aria-hidden>💬</span> {label}
    </a>
  );
}
