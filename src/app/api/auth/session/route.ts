import { NextRequest, NextResponse } from "next/server";
import type { DecodedIdToken } from "firebase-admin/auth";
import { createSessionCookie, verifyIdToken } from "@/lib/firebase-admin";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { SESSION_COOKIE } from "@/lib/server-auth";
import { limit } from "@/lib/security/rate-limit";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

type SessionDependency = "firebase_admin" | "database";

class SessionDependencyError extends Error {
  constructor(readonly dependency: SessionDependency, cause: unknown) {
    super(cause instanceof Error ? cause.message : "A sign-in dependency failed");
  }
}

function isFirebaseServiceFailure(message: string) {
  return /Firebase Admin|credential|private key|service account|auth\/internal-error|ECONN|ETIMEDOUT|ENOTFOUND/i.test(message);
}

function sessionErrorResponse(error: unknown) {
  if (error instanceof SessionDependencyError) {
    const code = error.dependency === "database" ? "database_unavailable" : "firebase_admin_unavailable";
    return NextResponse.json(
      { error: "The secure sign-in service is temporarily unavailable. Please try again shortly.", code },
      { status: 503 },
    );
  }

  const message = error instanceof Error ? error.message : "";
  const serviceUnavailable = /Firebase Admin|Mongo|Mongoose|database|ECONN|ETIMEDOUT|ENOTFOUND|credential|private key|service account/i.test(message);
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
    let identity: DecodedIdToken;
    try {
      identity = await verifyIdToken(idToken);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (isFirebaseServiceFailure(message)) throw new SessionDependencyError("firebase_admin", error);
      throw error;
    }
    if (!identity.email_verified) return NextResponse.json({ error: "Verify your email before signing in." }, { status: 403 });
    try {
      await connectToDatabase();
    } catch (error) {
      throw new SessionDependencyError("database", error);
    }
    const user = await User.findOneAndUpdate({ firebaseUid: identity.uid, active: true }, { $set: { lastLoginAt: new Date() } }, { new: true }).lean();
    if (!user) return NextResponse.json({ error: "This account is not authorised for hospital access." }, { status: 403 });
    let sessionCookie: string;
    try {
      sessionCookie = await createSessionCookie(idToken);
    } catch (error) {
      throw new SessionDependencyError("firebase_admin", error);
    }
    const response = NextResponse.json({ role: user.role, name: user.name });
    response.cookies.set(SESSION_COOKIE, sessionCookie, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 5 });
    try {
      await audit(identity.uid, "auth.login", "User", user._id.toString(), { role: user.role });
    } catch (error) {
      console.error("Login audit failed", error);
    }
    return response;
  } catch (error) {
    console.error("Session creation failed", error);
    return sessionErrorResponse(error);
  }
}
export function DELETE() { const response = NextResponse.json({ ok: true }); response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, expires: new Date(0), path: "/" }); return response; }
