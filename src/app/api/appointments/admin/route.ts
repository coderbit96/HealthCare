import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/server-auth";
import { Appointment } from "@/models/Appointment";
import { Counter } from "@/models/Counter";
import { DoctorSchedule } from "@/models/DoctorSchedule";

const bookingSchema = z.object({
  patient: z.string().length(24), patientName: z.string().trim().min(2).max(120), email: z.email(), phone: z.string().trim().min(8).max(30), department: z.string().trim().min(2).max(80),
  doctor: z.string().trim().min(2).max(120), doctorUid: z.string().min(1), startAt: z.coerce.date(), walkIn: z.boolean().default(false), message: z.string().trim().max(1_000).optional(),
});
const blockSchema = z.object({ action: z.literal("block"), doctorUid: z.string().min(1), startAt: z.coerce.date(), endAt: z.coerce.date(), reason: z.string().trim().min(2).max(300) });

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, "appointments:write");
    const body = await request.json();
    if (body?.action === "block") {
      const input = blockSchema.parse(body);
      if (input.endAt <= input.startAt) return NextResponse.json({ error: "Block end time must be later than start time" }, { status: 400 });
      const schedule = await DoctorSchedule.findOneAndUpdate({ doctorUid: input.doctorUid }, { $push: { blockedSlots: { startAt: input.startAt, endAt: input.endAt, reason: input.reason } } }, { new: true });
      if (!schedule) return NextResponse.json({ error: "Doctor schedule not found" }, { status: 404 });
      await audit(user.firebaseUid, "appointment.slot_blocked", "DoctorSchedule", schedule._id.toString(), { doctorUid: input.doctorUid, startAt: input.startAt, endAt: input.endAt });
      return NextResponse.json(schedule, { status: 201 });
    }
    const input = bookingSchema.parse(body);
    const schedule = await DoctorSchedule.findOne({ doctorUid: input.doctorUid }).lean();
    if (!schedule) return NextResponse.json({ error: "Doctor schedule not found" }, { status: 404 });
    const duration = schedule.consultationMinutes ?? 20;
    const endAt = new Date(input.startAt.getTime() + duration * 60_000);
    const dateKey = input.startAt.toISOString().slice(0, 10);
    const dayStart = new Date(`${dateKey}T00:00:00`); const dayEnd = new Date(`${dateKey}T23:59:59.999`);
    const sameDay = await Appointment.countDocuments({ doctorUid: input.doctorUid, startAt: { $gte: dayStart, $lte: dayEnd }, status: { $nin: ["cancelled", "no_show"] } });
    const overlapsBlock = schedule.blockedSlots.some((block: { startAt?: Date; endAt?: Date }) => block.startAt && block.endAt && input.startAt < block.endAt && endAt > block.startAt);
    if (schedule.leaveDates.includes(dateKey) || sameDay >= schedule.dailyLimit || overlapsBlock) return NextResponse.json({ error: "Selected doctor slot is unavailable" }, { status: 409 });
    const token = await Counter.findOneAndUpdate({ key: `token:${input.doctorUid}:${dateKey}` }, { $inc: { value: 1 } }, { upsert: true, new: true });
    const appointment = await Appointment.create({ ...input, reference: `APT-${Date.now().toString(36).toUpperCase()}`, preferredDate: input.startAt, endAt, token: token.value, status: input.walkIn ? "waiting" : "confirmed" });
    await audit(user.firebaseUid, "appointment.booked", "Appointment", appointment._id.toString(), { doctorUid: input.doctorUid, startAt: input.startAt, walkIn: input.walkIn });
    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    const duplicate = typeof error === "object" && error && "code" in error && (error as { code?: number }).code === 11000;
    const message = error instanceof z.ZodError ? "Invalid appointment details" : error instanceof Error ? error.message : "Unable to manage appointment";
    return NextResponse.json({ error: duplicate ? "This doctor slot has already been booked" : message }, { status: duplicate ? 409 : message === "Forbidden" ? 403 : 400 });
  }
}
