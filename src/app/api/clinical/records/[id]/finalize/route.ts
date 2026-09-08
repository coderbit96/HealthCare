import { NextRequest, NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/server-auth";
import { MedicalRecord } from "@/models/MedicalRecord";
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(request, "clinical:finalize");
    const { id } = await params;
    // Only the authoring clinician (or an admin) may finalize a record — a role-level
    // permission check alone would let any doctor finalize another doctor's draft.
    const filter: Record<string, unknown> = { _id: id, status: "draft" };
    if (user.role !== "admin") filter.clinicianUid = user.firebaseUid;
    const record = await MedicalRecord.findOneAndUpdate(filter, { status: "finalized", finalizedAt: new Date(), finalizedBy: user.firebaseUid }, { new: true });
    if (!record) return NextResponse.json({ error: "Draft record not found, already finalized, or not yours to finalize" }, { status: 404 });
    await audit(user.firebaseUid, "clinical_record.finalized", "MedicalRecord", record._id.toString(), { patient: record.patient?.toString() });
    return NextResponse.json(record);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to finalize clinical record";
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 400 });
  }
}
