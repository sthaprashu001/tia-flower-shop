import { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { getAllBouquets } from "@/lib/products";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const bouquets = await getAllBouquets();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "weekly", priority: 1.0 },
    { url: `${siteUrl}/bouquets`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/order`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/faq`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/contact`, changeFrequency: "monthly", priority: 0.5 },
  ];

  const bouquetPages: MetadataRoute.Sitemap = bouquets
    .filter((b) => b.available)
    .map((b) => ({
      url: `${siteUrl}/bouquets/${b.id}`,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

  return [...staticPages, ...bouquetPages];
}
