import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { requirePermission } from "@/lib/server-auth";
import { Appointment } from "@/models/Appointment";
import { limit } from "@/lib/security/rate-limit";

const appointmentSchema = z.object({ patientName: z.string().min(2).max(120), email: z.email(), phone: z.string().min(8).max(30), department: z.string().min(2).max(80), doctor: z.string().max(120).optional().or(z.literal("")), preferredDate: z.coerce.date(), message: z.string().max(1000).optional() });

export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, "appointments:read");
    const doctorUid = request.nextUrl.searchParams.get("doctorUid") ?? (user.role === "doctor" ? user.firebaseUid : undefined);
    const status = request.nextUrl.searchParams.get("status");
    const date = request.nextUrl.searchParams.get("date");
    const filter: Record<string, unknown> = {};
    if (doctorUid) filter.doctorUid = doctorUid;
    if (status) filter.status = status;
    if (date) { const start = new Date(`${date}T00:00:00`); const end = new Date(`${date}T23:59:59.999`); filter.preferredDate = { $gte: start, $lte: end }; }
    return NextResponse.json(await Appointment.find(filter).sort({ startAt: 1, preferredDate: 1 }).limit(100).lean());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load appointments";
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 401 });
  }
}

export async function POST(request: Request) {
  try {
    const limiter = limit(`public-appointment:${request.headers.get("x-forwarded-for") ?? "local"}`, 8, 60_000);
    if (!limiter.allowed) return NextResponse.json({ error: "Too many appointment requests. Please try again shortly." }, { status: 429, headers: { "Retry-After": String(limiter.retryAfter) } });
    const input = appointmentSchema.parse(await request.json());
    await connectToDatabase();
    const reference = `HC-${Date.now().toString(36).toUpperCase()}`;
    await Appointment.create({ ...input, reference });
    return NextResponse.json({ reference }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Please check the details you entered." }, { status: 400 });
    console.error("Appointment request failed", error);
    return NextResponse.json({ error: "We could not process your request right now." }, { status: 503 });
  }
}
