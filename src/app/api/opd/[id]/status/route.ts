import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/server-auth";
import { AuditLog } from "@/models/AuditLog";
import { Appointment } from "@/models/Appointment";
import { Counter } from "@/models/Counter";
import { Patient } from "@/models/Patient";
import { Visit } from "@/models/Visit";

const schema = z.object({ status: z.enum(["checked_in", "waiting", "in_consultation", "completed", "cancelled", "no_show"]) });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(request, "appointments:write");
    const { status } = schema.parse(await request.json()); const { id } = await params;
    const before = await Appointment.findById(id).lean();
    if (!before) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    const appointment = await Appointment.findByIdAndUpdate(id, { status }, { new: true });
    if (!appointment) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    let visit;
    if (status === "checked_in" || status === "waiting" || status === "in_consultation") {
      const patientId = appointment.patient ?? (await Patient.findOne({ email: appointment.email }).select("_id").lean())?._id;
      if (patientId) {
        visit = await Visit.findOne({ appointment: appointment._id });
        if (!visit) {
          const counter = await Counter.findOneAndUpdate({ key: `opd-visit:${new Date().getFullYear()}` }, { $inc: { value: 1 } }, { upsert: true, new: true });
          visit = await Visit.create({ visitNumber: `OPD-${new Date().getFullYear()}-${String(counter.value).padStart(6, "0")}`, patient: patientId, appointment: appointment._id, doctorUid: appointment.doctorUid, token: appointment.token, type: "opd", status: "open", checkedInAt: new Date() });
        }
      }
    }
    if (status === "completed" && appointment.patient) await Visit.findOneAndUpdate({ appointment: appointment._id }, { $set: { status: "completed", completedAt: new Date() } });
    await AuditLog.create({ actorUid: user.firebaseUid, action: `opd.${status}`, entityType: "Appointment", entityId: id, before, after: appointment.toObject() });
    return NextResponse.json({ appointment, visit });
  } catch (error) {
    const message = error instanceof z.ZodError ? "Invalid OPD status" : error instanceof Error ? error.message : "Unable to update OPD";
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 400 });
  }
}
