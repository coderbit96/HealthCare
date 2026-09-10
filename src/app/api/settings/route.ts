import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/server-auth";
import { HospitalSetting } from "@/models/HospitalSetting";

const settingSchema = z.object({
  key: z.string().trim().regex(/^(hospital|system)\.[a-z0-9_.-]{1,100}$/i, "Use a hospital.* or system.* setting key"),
  value: z.unknown(),
});

export async function GET(request: NextRequest) {
  try {
    await requirePermission(request, "settings:write");
    const requestedScope = request.nextUrl.searchParams.get("scope");
    const scope = requestedScope === "hospital" || requestedScope === "system" ? requestedScope : undefined;
    const filter = scope ? { key: { $regex: `^${scope}\\.` } } : {};
    return NextResponse.json(await HospitalSetting.find(filter).sort({ key: 1 }).lean());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load settings";
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 401 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requirePermission(request, "settings:write");
    const input = settingSchema.parse(await request.json());
    const setting = await HospitalSetting.findOneAndUpdate(
      { key: input.key },
      { $set: { value: input.value, updatedBy: user.firebaseUid } },
      { new: true, upsert: true, runValidators: true },
    );
    await audit(user.firebaseUid, "setting.updated", "HospitalSetting", setting._id.toString(), { key: input.key });
    return NextResponse.json(setting);
  } catch (error) {
    const message = error instanceof z.ZodError ? "Invalid setting" : error instanceof Error ? error.message : "Unable to save setting";
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 400 });
  }
}
