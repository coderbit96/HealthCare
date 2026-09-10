import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/server-auth";
import { audit } from "@/lib/audit";
import { Attendance } from "@/models/Attendance";
import { EmployeeProfile } from "@/models/EmployeeProfile";
import { Payroll } from "@/models/Payroll";

const money = z.coerce.number().finite().min(0);
const componentSchema = z.object({ label: z.string().trim().min(1).max(80), amount: money });
const payrollSchema = z.object({
  user: z.string().length(24),
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  basic: money.optional(),
  allowances: z.array(componentSchema).max(20).default([]),
  bonuses: money.default(0),
  deductions: money.default(0),
  advances: money.default(0),
  tax: money.default(0),
  unpaidLeaveDays: z.coerce.number().int().min(0).max(31).default(0),
});
const statusSchema = z.object({
  id: z.string().length(24),
  action: z.enum(["calculate", "approve", "mark_paid"]),
  paymentReference: z.string().trim().max(160).optional(),
});

function periodBounds(period: string) {
  const [year, month] = period.split("-").map(Number);
  const start = `${period}-01`;
  const next = new Date(Date.UTC(year!, month!, 1)).toISOString().slice(0, 10);
  const daysInMonth = new Date(year!, month!, 0).getDate();
  return { start, next, daysInMonth };
}

async function payrollValues(input: z.infer<typeof payrollSchema>) {
  const employee = await EmployeeProfile.findOne({ user: input.user }).select("salary overtimeRate").lean();
  const basic = input.basic ?? employee?.salary ?? 0;
  const { start, next, daysInMonth } = periodBounds(input.period);
  const attendance = await Attendance.find({ user: input.user, date: { $gte: start, $lt: next } }).lean();
  const summary = { present: 0, late: 0, halfDay: 0, onLeave: 0, absent: 0, workingMinutes: 0, overtimeMinutes: 0 };
  for (const record of attendance) {
    if (record.status === "present") summary.present += 1;
    if (record.status === "late") summary.late += 1;
    if (record.status === "half_day") summary.halfDay += 1;
    if (record.status === "leave") summary.onLeave += 1;
    if (record.status === "absent") summary.absent += 1;
    summary.workingMinutes += record.workingMinutes ?? 0;
    summary.overtimeMinutes += record.overtimeMinutes ?? 0;
  }
  const overtime = Math.round((summary.overtimeMinutes / 60) * (employee?.overtimeRate ?? 0) * 100) / 100;
  const allowanceTotal = input.allowances.reduce((total, line) => total + line.amount, 0);
  const dailyRate = basic / daysInMonth;
  const absenceDeduction = Math.round((dailyRate * (summary.absent + (summary.halfDay * 0.5) + input.unpaidLeaveDays)) * 100) / 100;
  const gross = Math.round((basic + allowanceTotal + input.bonuses + overtime) * 100) / 100;
  const totalDeductions = Math.round((input.deductions + input.advances + input.tax + absenceDeduction) * 100) / 100;
  const net = Math.round((gross - totalDeductions) * 100) / 100;
  return { basic, overtime, absenceDeduction, gross, net, attendanceSummary: summary };
}

export async function GET(request: NextRequest) {
  try {
    await requirePermission(request, "payroll:write");
    const filter: Record<string, string> = {};
    const user = request.nextUrl.searchParams.get("user");
    const period = request.nextUrl.searchParams.get("period");
    if (user) filter.user = user;
    if (period) filter.period = period;
    const records = await Payroll.find(filter).populate("user", "name email role department").sort({ period: -1, createdAt: -1 }).limit(250).lean();
    return NextResponse.json(records);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load payroll";
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requirePermission(request, "payroll:write");
    const input = payrollSchema.parse(await request.json());
    const computed = await payrollValues(input);
    if (computed.net < 0) return NextResponse.json({ error: "Deductions cannot exceed gross pay" }, { status: 400 });
    const existing = await Payroll.findOne({ user: input.user, period: input.period });
    if (existing && existing.status !== "draft") return NextResponse.json({ error: "Only payroll drafts can be edited. Create a new draft to revise a calculated, approved or paid record." }, { status: 409 });
    const payroll = await Payroll.findOneAndUpdate(
      { user: input.user, period: input.period },
      { $set: { ...input, ...computed, status: "draft" } },
      { new: true, upsert: true, runValidators: true },
    );
    await audit(actor.firebaseUid, "payroll.saved", "Payroll", payroll._id.toString(), { user: input.user, period: input.period, net: computed.net });
    return NextResponse.json(payroll, { status: existing ? 200 : 201 });
  } catch (error) {
    const message = error instanceof z.ZodError ? "Invalid payroll record" : error instanceof Error ? error.message : "Unable to save payroll";
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const actor = await requirePermission(request, "payroll:write");
    const input = statusSchema.parse(await request.json());
    const expectedStatus = input.action === "calculate" ? "draft" : input.action === "approve" ? "calculated" : "approved";
    const patch = input.action === "calculate"
      ? { status: "calculated", calculatedAt: new Date() }
      : input.action === "approve"
        ? { status: "approved", approvedBy: actor.firebaseUid, approvedAt: new Date() }
        : { status: "paid", paidAt: new Date(), paymentReference: input.paymentReference };
    const payroll = await Payroll.findOneAndUpdate({ _id: input.id, status: expectedStatus }, { $set: patch }, { new: true });
    if (!payroll) return NextResponse.json({ error: `Payroll record must be ${expectedStatus.replace("_", " ")} before this action` }, { status: 409 });
    await audit(actor.firebaseUid, `payroll.${input.action}`, "Payroll", payroll._id.toString(), { period: payroll.period });
    return NextResponse.json(payroll);
  } catch (error) {
    const message = error instanceof z.ZodError ? "Invalid payroll action" : error instanceof Error ? error.message : "Unable to update payroll";
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 400 });
  }
}
