import { Helmet } from "react-helmet-async";
import { useStoreSettings } from "@/hooks/useSupabase";

type Props = {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: "website" | "article" | "product";
  noIndex?: boolean;
  keywords?: string;
  jsonLd?: Record<string, any> | Record<string, any>[];
};

const safeParse = <T,>(raw: string | undefined, fallback: T): T => {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
};

const stripTrailingSlash = (s: string) => s.replace(/\/+$/, "");

const SEO = ({ title, description, path = "/", image, type = "website", noIndex, keywords, jsonLd }: Props) => {
  const { data: s = {} } = useStoreSettings();

  const brand = s["seo_brand_name"] || "TWINKLE";
  const template = s["seo_title_template"] || "{title} | {brand}";
  const defaultTitle = s["seo_default_title"] || brand;
  const defaultDesc = s["seo_default_description"] || "TWINKLE (highlightsbd) — Bangladeshi unisex clothing brand. Shop shirts, t-shirts, pants & everyday wear with cash on delivery across BD.";
  const defaultKeywords = s["seo_default_keywords"] || "";
  const defaultImage = s["seo_og_image"] || "/logo.png";
  const twitterHandle = s["seo_twitter_handle"] || "";
  const baseUrl = stripTrailingSlash(s["seo_base_url"] || "");
  const robotsSetting = s["seo_robots"] || "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

  // per-path overrides { "/about": { title, description, keywords, image, noIndex } }
  const overrides = safeParse<Record<string, any>>(s["seo_page_overrides"], {});
  const ov = overrides[path] || {};

  const finalTitleRaw = ov.title || title || defaultTitle;
  const finalTitle = finalTitleRaw === brand
    ? brand
    : template.replace("{title}", finalTitleRaw).replace("{brand}", brand);
  const finalDesc = (ov.description || description || defaultDesc).slice(0, 300);
  const finalKeywords = ov.keywords || keywords || defaultKeywords;
  const finalImage = ov.image || image || defaultImage;
  const finalNoIndex = ov.noIndex ?? noIndex;
  const absUrl = baseUrl ? `${baseUrl}${path}` : path;
  const absImage = finalImage?.startsWith("http") ? finalImage : (baseUrl ? `${baseUrl}${finalImage}` : finalImage);

  const ldArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  // Sitewide JSON-LD from admin
  const orgLd = safeParse<any | any[] | null>(s["seo_organization_jsonld"], null);
  if (orgLd) {
    if (Array.isArray(orgLd)) ldArray.push(...orgLd);
    else ldArray.push(orgLd);
  }

  return (
    <Helmet>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDesc} />
      {finalKeywords && <meta name="keywords" content={finalKeywords} />}
      <link rel="canonical" href={absUrl} />
      <meta name="robots" content={finalNoIndex ? "noindex, nofollow" : robotsSetting} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={brand} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDesc} />
      <meta property="og:url" content={absUrl} />
      <meta property="og:image" content={absImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDesc} />
      <meta name="twitter:image" content={absImage} />
      {twitterHandle && <meta name="twitter:site" content={twitterHandle} />}
      {twitterHandle && <meta name="twitter:creator" content={twitterHandle} />}
      {ldArray.map((ld, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(ld)}</script>
      ))}
    </Helmet>
  );
};

export default SEO;
