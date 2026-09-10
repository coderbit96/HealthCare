import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/server-auth";
import { audit } from "@/lib/audit";
import { Attendance } from "@/models/Attendance";

const attendanceSchema = z.object({ user: z.string().length(24), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), checkIn: z.coerce.date().optional(), checkOut: z.coerce.date().optional(), overtimeMinutes: z.number().int().min(0).max(1440).default(0), remarks: z.string().trim().max(1000).optional(), status: z.enum(["present", "absent", "late", "half_day", "leave", "holiday", "week_off"]).default("present") });

export async function GET(request: NextRequest) {
  try {
    await requirePermission(request, "employees:read");
    const filter: Record<string, unknown> = {};
    const user = request.nextUrl.searchParams.get("user");
    const date = request.nextUrl.searchParams.get("date");
    if (user) filter.user = user;
    if (date) filter.date = date;
    const month = request.nextUrl.searchParams.get("month");
    if (month && /^\d{4}-\d{2}$/.test(month)) filter.date = { $regex: `^${month}` };
    const department = request.nextUrl.searchParams.get("department");
    const records = await Attendance.find(filter).populate("user", "name email role department").sort({ date: -1, createdAt: -1 }).limit(1000).lean();
    const filtered = department ? records.filter((record) => typeof record.user === "object" && record.user && "department" in record.user && record.user.department === department) : records;
    if (request.nextUrl.searchParams.get("format") === "csv") { const rows = ["Employee,Department,Date,Check-in,Check-out,Working hours,Overtime,Status,Remarks", ...filtered.map((record) => { const staff = record.user as { name?: string; department?: string } | undefined; return [staff?.name ?? "", staff?.department ?? "", record.date, record.checkIn?.toISOString() ?? "", record.checkOut?.toISOString() ?? "", ((record.workingMinutes ?? 0) / 60).toFixed(2), ((record.overtimeMinutes ?? 0) / 60).toFixed(2), record.status, record.remarks ?? ""].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","); })]; return new NextResponse(rows.join("\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=attendance.csv" } }); }
    return NextResponse.json(filtered);
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
    const workingMinutes = input.checkIn && input.checkOut ? Math.max(0, Math.round((input.checkOut.getTime() - input.checkIn.getTime()) / 60_000)) : 0;
    const record = await Attendance.findOneAndUpdate({ user: input.user, date: input.date }, { $set: { ...input, workingMinutes } }, { upsert: true, new: true, runValidators: true });
    await audit(actor.firebaseUid, "attendance.recorded", "Attendance", record._id.toString(), { user: input.user, date: input.date, status: input.status });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    const message = error instanceof z.ZodError ? "Invalid attendance record" : error instanceof Error ? error.message : "Unable to record attendance";
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 400 });
  }
}
