/**
 * Trust content shown on the homepage. Edit this file — no other code changes.
 *
 * REVIEWS: add real customer comments (ask permission first). While the list is
 * empty the "What customers say" section stays hidden, so the site never shows
 * made-up reviews. Example:
 *   { name: "Sita, Lalitpur", text: "Flowers were fresh and exactly like the photo.", detail: "Welcome-home bouquet" }
 *
 * HANDOVER_PHOTO: a real photo of a handover near the terminal. Upload it to
 * public/images/ and set the path, e.g. "/images/handover.jpg". null = no photo.
 */
export interface Review {
  name: string;
  text: string;
  detail?: string;
}

export const REVIEWS: Review[] = [];

export const HANDOVER_PHOTO: string | null = null;
