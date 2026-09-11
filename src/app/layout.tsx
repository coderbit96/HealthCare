import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { PwaRegister } from "@/components/public/pwa-register";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://health-care-smoky-ten.vercel.app";
const fraunces = Fraunces({ variable: "--font-display", subsets: ["latin"], axes: ["SOFT", "WONK"] });
const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Health Care Pvt. Ltd.",
  title: { default: "Health Care Pvt. Ltd. | Care that feels human", template: "%s | Health Care Pvt. Ltd." },
  description: "Trusted specialists, modern medicine, appointments and compassionate care at Health Care Pvt. Ltd.",
  keywords: ["hospital", "health care", "doctors", "specialists", "appointments", "emergency care", "Kolkata hospital"],
  alternates: { canonical: "/" },
  category: "healthcare",
  formatDetection: { telephone: true, address: true, email: true },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  manifest: "/manifest.webmanifest",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  openGraph: { type: "website", locale: "en_IN", url: "/", siteName: "Health Care Pvt. Ltd.", title: "Health Care Pvt. Ltd. | Care that feels human", description: "Trusted specialists, modern medicine, appointments and compassionate care.", images: [{ url: "/images/home/hero-consultation.png", width: 1200, height: 630, alt: "Health Care Pvt. Ltd. consultation" }] },
  twitter: { card: "summary_large_image", title: "Health Care Pvt. Ltd. | Care that feels human", description: "Trusted specialists, modern medicine, appointments and compassionate care.", images: ["/images/home/hero-consultation.png"] },
  appleWebApp: { capable: true, title: "Health Care", statusBarStyle: "default" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en" className={`${fraunces.variable} ${inter.variable} h-full antialiased`}><body className="min-h-full flex flex-col"><PwaRegister />{children}</body></html>;
}
