import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Health Care Pvt. Ltd.",
    short_name: "Health Care",
    description: "Appointments, specialists and trusted hospital care from Health Care Pvt. Ltd.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f8f6f2",
    theme_color: "#0f766e",
    orientation: "portrait-primary",
    categories: ["health", "medical", "lifestyle"],
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }],
  };
}
