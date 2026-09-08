import { Schema, model, models } from "mongoose";
const CMSPageSchema = new Schema({ slug: { type: String, required: true, unique: true }, title: String, sections: [Schema.Types.Mixed], published: { type: Boolean, default: false }, seo: { title: String, description: String, image: String } }, { timestamps: true });
export const CMSPage = models.CMSPage || model("CMSPage", CMSPageSchema);
