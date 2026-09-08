import { Schema, model, models } from "mongoose";
const BlogSchema = new Schema({ title: { type: String, required: true }, slug: { type: String, required: true, unique: true }, excerpt: String, body: String, coverImage: String, author: String, published: { type: Boolean, default: false }, publishedAt: Date, seo: { title: String, description: String } }, { timestamps: true });
export const Blog = models.Blog || model("Blog", BlogSchema);
