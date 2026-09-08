import { Schema, model, models } from "mongoose";
const GallerySchema = new Schema({ title: String, image: { type: String, required: true }, alt: String, category: String, published: { type: Boolean, default: true }, order: { type: Number, default: 0 } }, { timestamps: true });
GallerySchema.index({ published: 1, order: 1 });
export const Gallery = models.Gallery || model("Gallery", GallerySchema);
