/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    // The mock/placeholder catalog (lib/data.ts) uses local .svg images;
    // next/image blocks SVGs by default. contentDispositionType keeps
    // this safe (forces download instead of inline execution for any
    // untrusted source, though these are all local files we control).
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    remotePatterns: [
      // Bouquet photos uploaded via the admin panel live in Vercel Blob,
      // on a per-store subdomain of this pattern.
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
