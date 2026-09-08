import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/server-auth";
import { User } from "@/models/User";

export async function GET(request: NextRequest) {
  try { await requirePermission(request, "users:read"); return NextResponse.json(await User.find().select("name email role active department createdAt").sort({ name: 1 }).lean()); }
  catch (error) { const message = error instanceof Error ? error.message : "Unable to load users"; return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 401 }); }
}
