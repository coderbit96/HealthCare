import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { Bed } from "@/models/Bed";
import { BedAssignment } from "@/models/BedAssignment";

export async function assignAvailableBed({ bedId, patientId, assignedBy }: { bedId: string; patientId: string; assignedBy: string }) {
  const db = await connectToDatabase(); const session = await db.startSession();
  try { let assignment: { _id: Types.ObjectId }[] | undefined; await session.withTransaction(async () => { const bed = await Bed.findOneAndUpdate({ _id: bedId, status: "available" }, { status: "occupied" }, { new: true, session }); if (!bed) throw new Error("Bed is not available"); assignment = await BedAssignment.create([{ bed: bed._id, patient: new Types.ObjectId(patientId), assignedBy, active: true }], { session }); }); return assignment?.[0]; }
  finally { await session.endSession(); }
}
export async function releaseAssignedBed({ bedId, reason }: { bedId: string; releasedBy: string; reason?: string }) {
  const db = await connectToDatabase(); const session = await db.startSession();
  try { let released: { _id: Types.ObjectId } | null | undefined; await session.withTransaction(async () => { released = await BedAssignment.findOneAndUpdate({ bed: bedId, active: true }, { active: false, releasedAt: new Date(), releaseReason: reason }, { new: true, session }); if (!released) throw new Error("No active assignment exists for this bed"); await Bed.updateOne({ _id: bedId, status: "occupied" }, { status: "cleaning" }, { session }); }); return released; }
  finally { await session.endSession(); }
}
