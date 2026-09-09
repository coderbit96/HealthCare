import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/server-auth";
import { audit } from "@/lib/audit";
import { Attendance } from "@/models/Attendance";

const attendanceSchema = z.object({ user: z.string().length(24), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), checkIn: z.coerce.date().optional(), checkOut: z.coerce.date().optional(), status: z.enum(["present", "absent", "late", "leave"]).default("present") });

export async function GET(request: NextRequest) {
  try {
    await requirePermission(request, "employees:read");
    const filter: Record<string, string> = {};
    const user = request.nextUrl.searchParams.get("user");
    const date = request.nextUrl.searchParams.get("date");
    if (user) filter.user = user;
    if (date) filter.date = date;
    return NextResponse.json(await Attendance.find(filter).populate("user", "name email role department").sort({ date: -1, createdAt: -1 }).limit(250).lean());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load attendance";
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requirePermission(request, "attendance:write");
    const input = attendanceSchema.parse(await request.json());
    if (input.checkIn && input.checkOut && input.checkOut < input.checkIn) return NextResponse.json({ error: "Check-out must follow check-in" }, { status: 400 });
    const record = await Attendance.findOneAndUpdate({ user: input.user, date: input.date }, { $set: input }, { upsert: true, new: true, runValidators: true });
    await audit(actor.firebaseUid, "attendance.recorded", "Attendance", record._id.toString(), { user: input.user, date: input.date, status: input.status });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    const message = error instanceof z.ZodError ? "Invalid attendance record" : error instanceof Error ? error.message : "Unable to record attendance";
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 400 });
  }
}
