import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { hasPermission } from "@/lib/roles";
import { requirePermission } from "@/lib/server-auth";
import { Attendance } from "@/models/Attendance";
import { LeaveRequest } from "@/models/LeaveRequest";
import { Appointment } from "@/models/Appointment";
import { DoctorSchedule } from "@/models/DoctorSchedule";
import { Notification } from "@/models/Notification";
import { User } from "@/models/User";

const requestSchema = z.object({
  leaveType: z.string().trim().min(2).max(80).default("Annual leave"),
  from: z.coerce.date(),
  to: z.coerce.date(),
  reason: z.string().trim().min(3).max(2_000),
  attachment: z.string().trim().max(14_000_000).optional(),
});
const decisionSchema = z.object({
  id: z.string().length(24),
  status: z.enum(["approved", "rejected"]),
  decisionNote: z.string().trim().max(2_000).optional(),
});

function leaveDays(from: Date, to: Date) {
  const days: string[] = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  while (cursor <= end) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, "leave:write");
    const canReview = hasPermission(user.role, "leave:approve", user.permissions, user.permissionMode);
    const requestedUser = request.nextUrl.searchParams.get("user");
    const filter = canReview ? (requestedUser ? { user: requestedUser } : {}) : { user: user.id };
    const records = await LeaveRequest.find(filter).populate("user", "name email role department").sort({ createdAt: -1 }).limit(250).lean();
    return NextResponse.json(records);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load leave requests";
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, "leave:write");
    const input = requestSchema.parse(await request.json());
    if (input.to < input.from) return NextResponse.json({ error: "Leave end date must not precede its start date" }, { status: 400 });
    const totalDays = leaveDays(input.from, input.to).length;
    const leave = await LeaveRequest.create({ ...input, totalDays, user: user.id });
    await audit(user.firebaseUid, "leave.requested", "LeaveRequest", leave._id.toString(), { leaveType: input.leaveType, from: input.from, to: input.to, totalDays });
    return NextResponse.json(leave, { status: 201 });
  } catch (error) {
    const message = error instanceof z.ZodError ? "Invalid leave request" : error instanceof Error ? error.message : "Unable to request leave";
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const reviewer = await requirePermission(request, "leave:approve");
    const input = decisionSchema.parse(await request.json());
    const leave = await LeaveRequest.findOneAndUpdate(
      { _id: input.id, status: "pending" },
      { $set: { status: input.status, decidedBy: reviewer.firebaseUid, reviewerName: reviewer.name, reviewedAt: new Date(), decisionNote: input.decisionNote } },
      { new: true },
    );
    if (!leave) return NextResponse.json({ error: "Pending leave request not found" }, { status: 404 });

    const staff = await User.findById(leave.user).select("name role firebaseUid").lean();
    if (!staff) return NextResponse.json({ error: "Employee account was not found" }, { status: 404 });
    const days = leaveDays(leave.from, leave.to);

    if (input.status === "approved") {
      await Promise.all(days.map((date) => Attendance.findOneAndUpdate(
        { user: leave.user, date },
        { $set: { status: "leave", checkIn: undefined, checkOut: undefined, workingMinutes: 0, overtimeMinutes: 0, remarks: `Approved ${leave.leaveType}: ${leave.reason}` } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )));

      if (staff.role === "doctor") {
        await DoctorSchedule.findOneAndUpdate({ doctorUid: staff.firebaseUid }, { $addToSet: { leaveDates: { $each: days } } });
        const start = new Date(days[0]!);
        const end = new Date(days.at(-1)!);
        end.setDate(end.getDate() + 1);
        const affectedAppointments = await Appointment.find({ doctorUid: staff.firebaseUid, startAt: { $gte: start, $lt: end }, status: { $nin: ["cancelled", "no_show", "completed"] } }).select("_id email patientName").lean();
        if (affectedAppointments.length) {
          await Appointment.updateMany({ _id: { $in: affectedAppointments.map((appointment) => appointment._id) } }, { $set: { rescheduleRequired: true, rescheduleReason: `Doctor ${staff.name} is on approved leave` } });
          const recipients = await User.find({ $or: [{ role: "receptionist", active: true }, { email: { $in: affectedAppointments.map((appointment) => appointment.email) }, role: "patient", active: true }] }).select("firebaseUid").lean();
          const notifications = recipients.flatMap((recipient) => affectedAppointments.map((appointment) => ({ recipientUid: recipient.firebaseUid, event: "doctor_leave", title: "Appointment needs rescheduling", body: `${appointment.patientName}'s appointment requires rescheduling because Dr. ${staff.name} is on approved leave.`, entityType: "Appointment", entityId: appointment._id.toString() })));
          if (notifications.length) await Notification.insertMany(notifications);
        }
      }
    }

    await Notification.create({
      recipientUid: staff.firebaseUid,
      event: "staff_leave_decision",
      title: `Leave request ${input.status}`,
      body: input.status === "approved" ? `${leave.leaveType} from ${days[0]} to ${days.at(-1)} has been approved.` : `${leave.leaveType} from ${days[0]} to ${days.at(-1)} has been rejected.${input.decisionNote ? ` ${input.decisionNote}` : ""}`,
      entityType: "LeaveRequest",
      entityId: leave._id.toString(),
    });
    await audit(reviewer.firebaseUid, `leave.${input.status}`, "LeaveRequest", leave._id.toString(), { reviewer: reviewer.name });
    return NextResponse.json(leave);
  } catch (error) {
    const message = error instanceof z.ZodError ? "Invalid leave decision" : error instanceof Error ? error.message : "Unable to decide leave request";
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 400 });
  }
}
