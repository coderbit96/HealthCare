import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/server-auth";
import { Appointment } from "@/models/Appointment";
import { DoctorSchedule } from "@/models/DoctorSchedule";

const schema = z.object({ status: z.enum(["pending", "confirmed", "checked_in", "waiting", "in_consultation", "completed", "cancelled", "no_show"]).optional(), startAt: z.coerce.date().optional(), message: z.string().trim().max(1_000).optional() }).refine((value) => value.status || value.startAt || value.message !== undefined, "No changes supplied");

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(request, "appointments:write");
    const { id } = await params; const input = schema.parse(await request.json());
    const before = await Appointment.findById(id);
    if (!before) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    const changes: Record<string, unknown> = { ...input };
    if (input.startAt) {
      if (!before.doctorUid) return NextResponse.json({ error: "This appointment has no assigned doctor" }, { status: 409 });
      const schedule = await DoctorSchedule.findOne({ doctorUid: before.doctorUid }).lean();
      if (!schedule) return NextResponse.json({ error: "Doctor schedule not found" }, { status: 409 });
      const endAt = new Date(input.startAt.getTime() + (schedule.consultationMinutes ?? 20) * 60_000);
      const dateKey = input.startAt.toISOString().slice(0, 10);
      const overlap = await Appointment.exists({ _id: { $ne: id }, doctorUid: before.doctorUid, startAt: { $lt: endAt }, endAt: { $gt: input.startAt }, status: { $nin: ["cancelled", "no_show"] } });
      if (schedule.leaveDates.includes(dateKey) || overlap) return NextResponse.json({ error: "Selected doctor slot is unavailable" }, { status: 409 });
      changes.startAt = input.startAt; changes.endAt = endAt; changes.preferredDate = input.startAt; changes.rescheduleRequired = false; changes.rescheduleReason = undefined;
    }
    const appointment = await Appointment.findByIdAndUpdate(id, { $set: changes }, { new: true, runValidators: true });
    await audit(user.firebaseUid, "appointment.updated", "Appointment", id, { before: before.toObject(), fields: Object.keys(changes) });
    return NextResponse.json(appointment);
  } catch (error) {
    const duplicate = typeof error === "object" && error && "code" in error && (error as { code?: number }).code === 11000;
    const message = error instanceof z.ZodError ? "Invalid appointment update" : error instanceof Error ? error.message : "Unable to update appointment";
    return NextResponse.json({ error: duplicate ? "This doctor slot has already been booked" : message }, { status: duplicate ? 409 : message === "Forbidden" ? 403 : 400 });
  }
}
