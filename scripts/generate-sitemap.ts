// Generates public/sitemap.xml — runs via predev/prebuild scripts.
import { writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://www.highlightsbd.shop";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://jvvdyfgegzxgmwrttgnl.supabase.co";
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/privacy-policy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/refund-policy", changefreq: "yearly", priority: "0.3" },
  { path: "/shipping-policy", changefreq: "yearly", priority: "0.3" },
];

async function getDynamicEntries(): Promise<SitemapEntry[]> {
  if (!SUPABASE_KEY) {
    console.warn("[sitemap] No Supabase key — skipping dynamic entries");
    return [];
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const entries: SitemapEntry[] = [];

  try {
    const { data: products } = await supabase
      .from("products")
      .select("id, updated_at")
      .eq("is_active", true);
    (products || []).forEach((p: any) => {
      entries.push({
        path: `/product/${p.id}`,
        lastmod: p.updated_at ? new Date(p.updated_at).toISOString().split("T")[0] : undefined,
        changefreq: "weekly",
        priority: "0.8",
      });
    });
  } catch (e) {
    console.warn("[sitemap] products fetch failed", e);
  }

  try {
    const { data: pages } = await supabase
      .from("custom_pages")
      .select("slug, updated_at")
      .eq("is_active", true);
    (pages || []).forEach((p: any) => {
      entries.push({
        path: `/page/${p.slug}`,
        lastmod: p.updated_at ? new Date(p.updated_at).toISOString().split("T")[0] : undefined,
        changefreq: "weekly",
        priority: "0.7",
      });
    });
  } catch (e) {
    console.warn("[sitemap] custom pages fetch failed", e);
  }

  return entries;
}

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

(async () => {
  const dynamic = await getDynamicEntries();
  const all = [...staticEntries, ...dynamic];
  writeFileSync(resolve("public/sitemap.xml"), generateSitemap(all));
  console.log(`sitemap.xml written (${all.length} entries)`);
})();
