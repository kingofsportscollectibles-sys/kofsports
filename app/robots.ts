import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/account", "/api/", "/studio"],
    },
    sitemap: "https://www.kofsports.com/sitemap.xml",
  };
}
