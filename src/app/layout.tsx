import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { PwaRegister } from "@/components/public/pwa-register";
import { JsonLd } from "@/components/seo/json-ld";
import { DEFAULT_SOCIAL_IMAGE, hospitalJsonLd, SITE_NAME, SITE_URL } from "@/lib/seo";
import "./globals.css";

const fraunces = Fraunces({ variable: "--font-display", subsets: ["latin"], axes: ["SOFT", "WONK"] });
const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: { default: "Health Care Pvt. Ltd. | Hospital care in Kolkata", template: "%s | Health Care Pvt. Ltd." },
  description: "Health Care Pvt. Ltd. in Kolkata offers specialist consultations, diagnostics, appointments and 24/7 emergency care.",
  keywords: ["hospital in Kolkata", "Kolkata hospital", "specialist doctors in Kolkata", "book doctor appointment", "emergency hospital", "diagnostic services", "Health Care Pvt. Ltd."],
  alternates: { canonical: "/" },
  category: "healthcare",
  formatDetection: { telephone: true, address: true, email: true },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  manifest: "/manifest.webmanifest",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  openGraph: { type: "website", locale: "en_IN", url: "/", siteName: SITE_NAME, title: "Health Care Pvt. Ltd. | Hospital care in Kolkata", description: "Specialist consultations, diagnostics, appointments and 24/7 emergency care in Kolkata.", images: [{ url: DEFAULT_SOCIAL_IMAGE, width: 1200, height: 630, alt: "Health Care Pvt. Ltd. hospital care" }] },
  twitter: { card: "summary_large_image", title: "Health Care Pvt. Ltd. | Hospital care in Kolkata", description: "Specialist consultations, diagnostics, appointments and 24/7 emergency care in Kolkata.", images: [DEFAULT_SOCIAL_IMAGE] },
  verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION },
  appleWebApp: { capable: true, title: "Health Care", statusBarStyle: "default" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en-IN" className={`${fraunces.variable} ${inter.variable} h-full antialiased`}><body className="min-h-full flex flex-col"><JsonLd data={hospitalJsonLd} /><PwaRegister />{children}</body></html>;
}
