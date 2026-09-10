import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/server-auth";
import { Admission } from "@/models/Admission";
import { Visit } from "@/models/Visit";
import { releaseAssignedBed } from "@/lib/bed-operations";

const schema = z.object({ dischargeSummary: z.string().trim().min(3).max(5_000), reason: z.string().trim().max(300).optional() });

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(request, "discharge:write");
    const { id } = await params; const input = schema.parse(await request.json());
    const admission = await Admission.findOne({ _id: id, status: { $in: ["admitted", "transferred"] } });
    if (!admission) return NextResponse.json({ error: "Active admission not found" }, { status: 404 });
    if (admission.bed) await releaseAssignedBed({ bedId: admission.bed.toString(), releasedBy: user.firebaseUid, reason: input.reason ?? "Patient discharged" });
    admission.status = "discharged"; admission.dischargedAt = new Date(); admission.dischargeSummary = input.dischargeSummary;
    await admission.save();
    await Visit.updateMany({ patient: admission.patient, type: "ipd", status: "open" }, { $set: { status: "completed", completedAt: new Date() } });
    await audit(user.firebaseUid, "admission.discharged", "Admission", id, { bed: admission.bed?.toString(), bedStatus: "cleaning" });
    return NextResponse.json({ admission, bedStatus: "cleaning" });
  } catch (error) {
    const message = error instanceof z.ZodError ? "Invalid discharge details" : error instanceof Error ? error.message : "Unable to discharge patient";
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 400 });
  }
}
