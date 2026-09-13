import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { put } from "@vercel/blob";
import { authOptions } from "@/lib/auth";

/**
 * POST /api/upload
 * Body: multipart/form-data with a "file" field.
 *
 * Uploads an image to Vercel Blob storage and returns its public URL.
 * That URL is what gets saved into a product's `image` field — MongoDB
 * stores the link, Vercel Blob stores the actual file.
 */
const MAX_SIZE_BYTES = 4 * 1024 * 1024; // 4MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasOidcBlob = Boolean(process.env.BLOB_STORE_ID);
  const hasStaticToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  if (!hasOidcBlob && !hasStaticToken) {
    return NextResponse.json(
      { error: "Image storage is not set up yet. Add a Blob store in your Vercel project (Storage tab)." },
      { status: 400 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only JPG, PNG, or WEBP images are allowed." }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Image must be under 4MB." }, { status: 400 });
  }

  try {
    const blob = await put(`products/${Date.now()}-${file.name}`, file, {
      access: "public",
      // Explicit token always takes priority over OIDC auto-detection
      // (see @vercel/blob docs on credential resolution order). Passing
      // it directly avoids ambiguity about which store OIDC resolves to.
      ...(process.env.BLOB_READ_WRITE_TOKEN ? { token: process.env.BLOB_READ_WRITE_TOKEN } : {}),
    });
    return NextResponse.json({ url: blob.url }, { status: 201 });
  } catch (err) {
    console.error("Failed to upload image:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Upload failed: ${message}` }, { status: 500 });
  }
}
