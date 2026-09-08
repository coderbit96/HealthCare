import { Schema, model, models } from "mongoose";
const CmsContentSchema = new Schema({ key: { type: String, required: true, unique: true }, type: { type: String, enum: ["homepage_banner", "about", "service", "facility", "package", "gallery", "blog", "faq", "testimonial", "contact", "social", "seo"], required: true }, title: String, slug: String, payload: Schema.Types.Mixed, published: { type: Boolean, default: false }, seo: { title: String, description: String, image: String } }, { timestamps: true });
export const CmsContent = models.CmsContent || model("CmsContent", CmsContentSchema);
