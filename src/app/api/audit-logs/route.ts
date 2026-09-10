import { NextRequest, NextResponse } from "next/server";
import { AuditLog } from "@/models/AuditLog";
import { requirePermission } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  try {
    await requirePermission(request, "reports:read");
    return NextResponse.json(await AuditLog.find().sort({ createdAt: -1 }).limit(100).lean());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load audit logs";
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 401 });
  }
}
