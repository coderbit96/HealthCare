import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://health-care-smoky-ten.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/portal", "/login", "/register", "/api/"] }],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
