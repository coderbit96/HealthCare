import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { hasPermission } from "@/lib/roles";
import { requirePermission } from "@/lib/server-auth";
import { LeaveRequest } from "@/models/LeaveRequest";

const requestSchema = z.object({ from: z.coerce.date(), to: z.coerce.date(), reason: z.string().trim().min(3).max(2_000) });
const decisionSchema = z.object({ id: z.string().length(24), status: z.enum(["approved", "rejected"]), decisionNote: z.string().trim().max(2_000).optional() });

export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, "leave:write");
    const canReview = hasPermission(user.role, "leave:approve", user.permissions);
    const requestedUser = request.nextUrl.searchParams.get("user");
    const filter = canReview ? (requestedUser ? { user: requestedUser } : {}) : { user: user.id };
    return NextResponse.json(await LeaveRequest.find(filter).populate("user", "name email role department").sort({ createdAt: -1 }).limit(250).lean());
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
    const leave = await LeaveRequest.create({ ...input, user: user.id });
    await audit(user.firebaseUid, "leave.requested", "LeaveRequest", leave._id.toString(), { from: input.from, to: input.to });
    return NextResponse.json(leave, { status: 201 });
  } catch (error) {
    const message = error instanceof z.ZodError ? "Invalid leave request" : error instanceof Error ? error.message : "Unable to request leave";
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requirePermission(request, "leave:approve");
    const input = decisionSchema.parse(await request.json());
    const leave = await LeaveRequest.findOneAndUpdate({ _id: input.id, status: "pending" }, { $set: { status: input.status, decidedBy: user.firebaseUid, decisionNote: input.decisionNote } }, { new: true });
    if (!leave) return NextResponse.json({ error: "Pending leave request not found" }, { status: 404 });
    await audit(user.firebaseUid, `leave.${input.status}`, "LeaveRequest", leave._id.toString());
    return NextResponse.json(leave);
  } catch (error) {
    const message = error instanceof z.ZodError ? "Invalid leave decision" : error instanceof Error ? error.message : "Unable to decide leave request";
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 400 });
  }
}
