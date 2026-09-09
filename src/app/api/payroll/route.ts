import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/server-auth";
import { audit } from "@/lib/audit";
import { Payroll } from "@/models/Payroll";

const payrollSchema = z.object({ user: z.string().length(24), period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/), basic: z.number().min(0), overtime: z.number().min(0).default(0), deductions: z.number().min(0).default(0) });
const statusSchema = z.object({ id: z.string().length(24), status: z.enum(["approved", "paid"]) });

export async function GET(request: NextRequest) {
  try {
    await requirePermission(request, "payroll:write");
    const filter: Record<string, string> = {};
    const user = request.nextUrl.searchParams.get("user");
    const period = request.nextUrl.searchParams.get("period");
    if (user) filter.user = user;
    if (period) filter.period = period;
    return NextResponse.json(await Payroll.find(filter).populate("user", "name email role department").sort({ period: -1, createdAt: -1 }).limit(250).lean());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load payroll";
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requirePermission(request, "payroll:write");
    const input = payrollSchema.parse(await request.json());
    const net = input.basic + input.overtime - input.deductions;
    if (net < 0) return NextResponse.json({ error: "Deductions cannot exceed gross pay" }, { status: 400 });
    const payroll = await Payroll.findOneAndUpdate({ user: input.user, period: input.period }, { $set: { ...input, net, status: "draft" } }, { new: true, upsert: true, runValidators: true });
    await audit(actor.firebaseUid, "payroll.saved", "Payroll", payroll._id.toString(), { user: input.user, period: input.period, net });
    return NextResponse.json(payroll, { status: 201 });
  } catch (error) {
    const message = error instanceof z.ZodError ? "Invalid payroll record" : error instanceof Error ? error.message : "Unable to save payroll";
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const actor = await requirePermission(request, "payroll:write");
    const input = statusSchema.parse(await request.json());
    const payroll = await Payroll.findOneAndUpdate({ _id: input.id, status: input.status === "paid" ? "approved" : "draft" }, { $set: { status: input.status } }, { new: true });
    if (!payroll) return NextResponse.json({ error: "Payroll record is not in the required state" }, { status: 409 });
    await audit(actor.firebaseUid, `payroll.${input.status}`, "Payroll", payroll._id.toString());
    return NextResponse.json(payroll);
  } catch (error) {
    const message = error instanceof z.ZodError ? "Invalid payroll status" : error instanceof Error ? error.message : "Unable to update payroll";
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 400 });
  }
}
