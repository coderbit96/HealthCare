import type { MetadataRoute } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import { Blog } from "@/models/Blog";
import { Department } from "@/models/Department";
import { DoctorProfile } from "@/models/DoctorProfile";
import { SITE_URL } from "@/lib/seo";

const staticPaths = ["", "/about", "/services", "/doctors", "/departments", "/facilities", "/health-packages", "/gallery", "/blogs", "/blogs/heart-health-everyday", "/blogs/when-to-see-a-doctor", "/blogs/family-health-checks", "/contact", "/appointments"];
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = staticPaths.map((path) => ({ url: `${SITE_URL}${path}`, lastModified: new Date(), changeFrequency: path === "" ? "weekly" : path.startsWith("/blogs/") ? "monthly" : "monthly", priority: path === "" ? 1 : path === "/appointments" ? 0.9 : 0.7, ...(path === "" ? { images: [`${SITE_URL}/opengraph-image`] } : {}) }));
  try {
    await connectToDatabase();
    const [departments, blogs, doctors] = await Promise.all([
      Department.find({ active: true, published: true }).select("name updatedAt").lean(),
      Blog.find({ published: true }).select("slug updatedAt").lean(),
      DoctorProfile.find({ active: true }).populate("user", "name role active").select("user updatedAt").lean(),
    ]);
    for (const department of departments) entries.push({ url: `${SITE_URL}/departments/${slugify(department.name)}`, lastModified: department.updatedAt, changeFrequency: "monthly", priority: 0.8 });
    for (const blog of blogs) if (blog.slug) entries.push({ url: `${SITE_URL}/blogs/${blog.slug}`, lastModified: blog.updatedAt, changeFrequency: "monthly", priority: 0.7 });
    for (const doctor of doctors) {
      const account = doctor.user as unknown as { name?: string; role?: string; active?: boolean };
      if (account?.name && account.role === "doctor" && account.active) entries.push({ url: `${SITE_URL}/doctors/${slugify(account.name.replace(/^dr\.\s*/i, ""))}`, lastModified: doctor.updatedAt, changeFrequency: "monthly", priority: 0.7 });
    }
  } catch { /* Keep core public pages indexed while the database is unavailable. */ }
  return entries;
}
