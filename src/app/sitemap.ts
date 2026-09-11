import type { MetadataRoute } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import { Blog } from "@/models/Blog";
import { Department } from "@/models/Department";
import { DoctorProfile } from "@/models/DoctorProfile";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://health-care-smoky-ten.vercel.app";
const staticPaths = ["", "/about", "/services", "/doctors", "/departments", "/facilities", "/health-packages", "/gallery", "/blogs", "/contact", "/appointments"];
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = staticPaths.map((path) => ({ url: `${siteUrl}${path}`, lastModified: new Date(), changeFrequency: path === "" ? "weekly" : "monthly", priority: path === "" ? 1 : 0.7 }));
  try {
    await connectToDatabase();
    const [departments, blogs, doctors] = await Promise.all([
      Department.find({ active: true, published: true }).select("name updatedAt").lean(),
      Blog.find({ published: true }).select("slug updatedAt").lean(),
      DoctorProfile.find({ active: true }).populate("user", "name role active").select("user updatedAt").lean(),
    ]);
    for (const department of departments) entries.push({ url: `${siteUrl}/departments/${slugify(department.name)}`, lastModified: department.updatedAt, changeFrequency: "monthly", priority: 0.8 });
    for (const blog of blogs) if (blog.slug) entries.push({ url: `${siteUrl}/blogs/${blog.slug}`, lastModified: blog.updatedAt, changeFrequency: "monthly", priority: 0.7 });
    for (const doctor of doctors) {
      const account = doctor.user as unknown as { name?: string; role?: string; active?: boolean };
      if (account?.name && account.role === "doctor" && account.active) entries.push({ url: `${siteUrl}/doctors/${slugify(account.name.replace(/^dr\.\s*/i, ""))}`, lastModified: doctor.updatedAt, changeFrequency: "monthly", priority: 0.7 });
    }
  } catch { /* Keep core public pages indexed while the database is unavailable. */ }
  return entries;
}
