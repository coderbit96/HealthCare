import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/server-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Appointment } from "@/models/Appointment";
import { Patient } from "@/models/Patient";

export async function GET(request: NextRequest) {
  try {
    await requirePermission(request, "dashboard:read");
    await connectToDatabase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const [todayAppointments, pendingAppointments, patients] = await Promise.all([
      Appointment.countDocuments({ preferredDate: { $gte: today, $lt: tomorrow }, status: { $ne: "cancelled" } }),
      Appointment.countDocuments({ status: "requested" }),
      Patient.countDocuments(),
    ]);
    return NextResponse.json({ todayAppointments, pendingAppointments, patients });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load summary";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 503;
    return NextResponse.json({ error: message }, { status });
  }
}
