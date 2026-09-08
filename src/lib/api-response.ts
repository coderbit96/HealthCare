import { NextResponse } from "next/server";
export const api = { ok: <T>(data: T, status = 200) => NextResponse.json({ data }, { status }), error: (code: "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "VALIDATION_ERROR" | "CONFLICT" | "INTERNAL_ERROR", message: string, status: number) => NextResponse.json({ error: { code, message } }, { status }) };
