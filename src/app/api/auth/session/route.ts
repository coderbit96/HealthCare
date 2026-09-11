import { NextRequest, NextResponse } from "next/server";
import { createSessionCookie, verifyIdToken } from "@/lib/firebase-admin";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { SESSION_COOKIE } from "@/lib/server-auth";
import { limit } from "@/lib/security/rate-limit";
import { audit } from "@/lib/audit";

function sessionErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  const serviceUnavailable = /Firebase Admin|Mongo|Mongoose|database|ECONN|ETIMEDOUT|ENOTFOUND/i.test(message);
  const responseMessage = serviceUnavailable
    ? "The secure sign-in service is temporarily unavailable. Please try again shortly."
    : "Unable to create a secure sign-in session.";
  return NextResponse.json(
    { error: responseMessage, code: serviceUnavailable ? "authentication_service_unavailable" : "session_creation_failed" },
    { status: serviceUnavailable ? 503 : 401 },
  );
}

export async function POST(request: NextRequest) {
  try {
    const limiter = limit(`session:${request.headers.get("x-forwarded-for") ?? "local"}`, 10, 60_000);
    if (!limiter.allowed) return NextResponse.json({ error: "Too many sign-in attempts. Try again shortly." }, { status: 429, headers: { "Retry-After": String(limiter.retryAfter) } });
    const { idToken } = await request.json();
    if (typeof idToken !== "string") return NextResponse.json({ error: "Missing identity token" }, { status: 400 });
    const identity = await verifyIdToken(idToken);
    if (!identity.email_verified) return NextResponse.json({ error: "Verify your email before signing in." }, { status: 403 });
    await connectToDatabase();
    const user = await User.findOneAndUpdate({ firebaseUid: identity.uid, active: true }, { $set: { lastLoginAt: new Date() } }, { new: true }).lean();
    if (!user) return NextResponse.json({ error: "This account is not authorised for hospital access." }, { status: 403 });
    const response = NextResponse.json({ role: user.role, name: user.name });
    response.cookies.set(SESSION_COOKIE, await createSessionCookie(idToken), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 5 });
    await audit(identity.uid, "auth.login", "User", user._id.toString(), { role: user.role });
    return response;
  } catch (error) {
    console.error("Session creation failed", error);
    return sessionErrorResponse(error);
  }
}
export function DELETE() { const response = NextResponse.json({ ok: true }); response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, expires: new Date(0), path: "/" }); return response; }
