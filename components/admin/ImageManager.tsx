"use client";

import { useState } from "react";

const MAX_IMAGES = 8;

/**
 * Shrinks a big phone photo before uploading (max 1600px, JPEG). Faster to
 * upload, faster for customers to load, and keeps it under the upload limit.
 * If anything goes wrong the original file is used unchanged.
 */
async function shrinkImage(file: File): Promise<File> {
  try {
    if (file.size < 300 * 1024) return file;
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

/**
 * Multi-photo uploader for a product. The first photo is the cover (used on
 * the homepage, cart and as the first slide). Photos can be reordered,
 * made the cover, or removed.
 */
export default function ImageManager({
  images,
  onChange,
  onBusyChange,
}: {
  images: string[];
  onChange: (images: string[]) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // allow choosing the same file again
    if (files.length === 0) return;

    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      setError(`You can add up to ${MAX_IMAGES} photos.`);
      return;
    }
    const chosen = files.slice(0, room);

    setError(files.length > room ? `Only the first ${room} photo(s) were added (max ${MAX_IMAGES}).` : null);
    setUploading(true);
    onBusyChange?.(true);

    let current = images;
    try {
      for (const file of chosen) {
        const body = new FormData();
        body.append("file", await shrinkImage(file));
        const res = await fetch("/api/upload", { method: "POST", body });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed.");
        current = [...current, data.url];
        onChange(current); // show each photo as soon as it's uploaded
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      onBusyChange?.(false);
    }
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  function remove(i: number) {
    onChange(images.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      <input
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFiles}
        disabled={uploading || images.length >= MAX_IMAGES}
        className="mt-1 w-full text-sm"
      />
      <p className="mt-1 text-xs text-charcoal/50">
        Add up to {MAX_IMAGES} photos (different flowers, wrapping papers, angles). The first photo is the cover.
        You can select several files at once.
      </p>
      {uploading && <p className="mt-1 text-sm text-charcoal/60">Uploading…</p>}
      {error && <p className="mt-1 text-sm text-rose-dark">{error}</p>}

      {images.length > 0 && (
        <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((src, i) => (
            <li key={src + i} className="rounded-md border border-sand bg-white p-1.5">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Photo ${i + 1}`} className="aspect-square w-full rounded object-cover" />
                {i === 0 && (
                  <span className="absolute left-1 top-1 rounded-full bg-rose px-2 py-0.5 text-[10px] font-semibold text-ivory">
                    Cover
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex items-center justify-between text-xs">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, i - 1)}
                    disabled={i === 0}
                    aria-label="Move earlier"
                    className="rounded border border-sand px-1.5 py-0.5 disabled:opacity-30"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, i + 1)}
                    disabled={i === images.length - 1}
                    aria-label="Move later"
                    className="rounded border border-sand px-1.5 py-0.5 disabled:opacity-30"
                  >
                    →
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label="Remove photo"
                  className="text-charcoal/50 hover:text-rose-dark"
                >
                  Remove
                </button>
              </div>
              {i !== 0 && (
                <button
                  type="button"
                  onClick={() => move(i, 0)}
                  className="mt-1 w-full text-left text-[11px] text-rose-dark hover:underline"
                >
                  Make cover
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
