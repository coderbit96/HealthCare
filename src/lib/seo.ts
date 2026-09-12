import type { Metadata } from "next";

const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://health-care-smoky-ten.vercel.app";

export const SITE_URL = configuredUrl.replace(/\/$/, "");
export const SITE_NAME = "Health Care Pvt. Ltd.";
export const DEFAULT_SOCIAL_IMAGE = "/opengraph-image";

export function absoluteUrl(path = "/") {
  return new URL(path, `${SITE_URL}/`).toString();
}

export function publicMetadata({
  title,
  description,
  path,
  type = "website",
}: {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      url: path,
      siteName: SITE_NAME,
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [{ url: DEFAULT_SOCIAL_IMAGE, width: 1200, height: 630, alt: `${SITE_NAME} hospital care` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [DEFAULT_SOCIAL_IMAGE],
    },
  };
}

export const privateMetadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export const hospitalJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Hospital",
      "@id": `${SITE_URL}/#hospital`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: absoluteUrl("/icon.svg"),
      image: absoluteUrl(DEFAULT_SOCIAL_IMAGE),
      telephone: "+91 33 4000 2000",
      address: {
        "@type": "PostalAddress",
        streetAddress: "12 Wellness Avenue",
        addressLocality: "Kolkata",
        addressRegion: "West Bengal",
        postalCode: "700001",
        addressCountry: "IN",
      },
      areaServed: { "@type": "City", name: "Kolkata" },
      medicalSpecialty: ["Cardiology", "Neurology", "Orthopedic", "Pediatric", "Emergency"],
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+91 33 4000 2000",
        contactType: "emergency",
        availableLanguage: ["en", "bn", "hi"],
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      publisher: { "@id": `${SITE_URL}/#hospital` },
      inLanguage: "en-IN",
    },
  ],
};
