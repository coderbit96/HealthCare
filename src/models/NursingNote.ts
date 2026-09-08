import { Schema, model, models } from "mongoose";
const NursingNoteSchema = new Schema({ patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true }, admission: { type: Schema.Types.ObjectId, ref: "Admission" }, visit: { type: Schema.Types.ObjectId, ref: "Visit" }, creatorUid: { type: String, required: true }, note: { type: String, required: true }, revisions: [{ note: String, by: String, at: Date }] }, { timestamps: true });
export const NursingNote = models.NursingNote || model("NursingNote", NursingNoteSchema);
