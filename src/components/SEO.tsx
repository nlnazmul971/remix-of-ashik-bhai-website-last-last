import { Helmet } from "react-helmet-async";
import { useStoreSettings } from "@/hooks/useSupabase";
import { useLanguage } from "@/contexts/LanguageContext";
import { localeMap, LANGUAGES } from "@/lib/translations";

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
const stripTrailing = (s: string) => s.replace(/\/+$/, "");

const SEO = ({ title, description, path = "/", image, type = "website", noIndex, keywords, jsonLd }: Props) => {
  const { data: s = {} } = useStoreSettings();
  const { lang } = useLanguage();

  // All defaults sourced from admin settings — no hardcoded brand identity.
  const brand = s["seo_brand_name"] || s["footer_brand_name"] || "";
  const template = s["seo_title_template"] || "{title} | {brand}";
  const defaultTitle = s["seo_default_title"] || brand;
  const defaultDesc = s["seo_default_description"] || "";
  const defaultKeywords = s["seo_default_keywords"] || "";
  const defaultImage = s["seo_og_image"] || "";
  const twitterHandle = s["seo_twitter_handle"] || "";
  const baseUrl = stripTrailing(s["seo_base_url"] || "");
  const locale = localeMap[lang] || s["seo_locale"] || "en_US";
  const robotsSetting = s["seo_robots"] || "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

  // Per-path overrides: { "/about": { title, description, keywords, image, noIndex } }
  const overrides = safeParse<Record<string, any>>(s["seo_page_overrides"], {});
  const ov = overrides[path] || {};

  const titleSource = ov.title || title || defaultTitle;
  const finalTitle = titleSource === brand
    ? brand
    : template.replace("{title}", titleSource).replace("{brand}", brand);
  const finalDesc = (ov.description || description || defaultDesc).slice(0, 300);
  const finalKeywords = ov.keywords || keywords || defaultKeywords;
  const finalImage = ov.image || image || defaultImage;
  const finalNoIndex = ov.noIndex ?? noIndex;
  const absUrl = baseUrl ? `${baseUrl}${path}` : path;
  const absImage = finalImage
    ? (finalImage.startsWith("http") ? finalImage : (baseUrl ? `${baseUrl}${finalImage}` : finalImage))
    : "";

  const ldArray = jsonLd ? (Array.isArray(jsonLd) ? [...jsonLd] : [jsonLd]) : [];
  // Sitewide structured data from admin (Organization / LocalBusiness / WebSite ...)
  const orgLd = safeParse<any | any[] | null>(s["seo_organization_jsonld"], null);
  if (orgLd) {
    if (Array.isArray(orgLd)) ldArray.push(...orgLd);
    else ldArray.push(orgLd);
  }

  return (
    <Helmet htmlAttributes={{ lang }}>
      <title>{finalTitle}</title>
      {finalDesc && <meta name="description" content={finalDesc} />}
      {finalKeywords && <meta name="keywords" content={finalKeywords} />}
      <link rel="canonical" href={absUrl} />
      {baseUrl && LANGUAGES.map((l) => (
        <link key={l.code} rel="alternate" hrefLang={l.code} href={`${baseUrl}${path}?lang=${l.code}`} />
      ))}
      {baseUrl && <link rel="alternate" hrefLang="x-default" href={absUrl} />}
      <meta name="robots" content={finalNoIndex ? "noindex, nofollow" : robotsSetting} />

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={brand} />
      <meta property="og:title" content={finalTitle} />
      {finalDesc && <meta property="og:description" content={finalDesc} />}
      <meta property="og:url" content={absUrl} />
      {absImage && <meta property="og:image" content={absImage} />}
      <meta property="og:locale" content={locale} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      {finalDesc && <meta name="twitter:description" content={finalDesc} />}
      {absImage && <meta name="twitter:image" content={absImage} />}
      {twitterHandle && <meta name="twitter:site" content={twitterHandle} />}
      {twitterHandle && <meta name="twitter:creator" content={twitterHandle} />}

      {s["seo_google_verification"] && <meta name="google-site-verification" content={s["seo_google_verification"]} />}
      {s["seo_bing_verification"] && <meta name="msvalidate.01" content={s["seo_bing_verification"]} />}
      {s["seo_facebook_verification"] && <meta name="facebook-domain-verification" content={s["seo_facebook_verification"]} />}
      {s["seo_pinterest_verification"] && <meta name="p:domain_verify" content={s["seo_pinterest_verification"]} />}

      {ldArray.map((ld, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(ld)}</script>
      ))}
    </Helmet>
  );
};

export default SEO;
