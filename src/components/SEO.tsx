import { Helmet } from "react-helmet-async";

type Props = {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  type?: "website" | "article" | "product";
  noIndex?: boolean;
  jsonLd?: Record<string, any> | Record<string, any>[];
};

const SEO = ({ title, description, path = "/", image = "/logo.png", type = "website", noIndex, jsonLd }: Props) => {
  const fullTitle = title.includes("HIGHLIGHTS") ? title : `${title} | HIGHLIGHTS`;
  const desc = description || "HIGHLIGHTS (highlightsbd) — Bangladeshi unisex clothing brand. Shop shirts, t-shirts, pants & everyday wear with cash on delivery across BD.";
  const ldArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={path} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={path} />
      <meta property="og:image" content={image} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={image} />
      {ldArray.map((ld, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(ld)}</script>
      ))}
    </Helmet>
  );
};

export default SEO;
