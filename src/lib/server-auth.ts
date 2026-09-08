import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { type Permission, type Role, hasPermission } from "@/lib/roles";
import { verifyIdToken, verifySessionCookie } from "@/lib/firebase-admin";
import { User } from "@/models/User";

export const SESSION_COOKIE = "health-care-session";
export type AuthenticatedUser = { id: string; firebaseUid: string; name: string; email: string; role: Role; active: boolean; permissions: Permission[]; patient?: string };

async function findActiveUser(firebaseUid: string): Promise<AuthenticatedUser> {
  await connectToDatabase();
  const user = await User.findOne({ firebaseUid }).lean();
  if (!user) throw new Error("Account is not registered with this hospital");
  if (!user.active || user.status !== "active") throw new Error("Account is inactive");
  return { id: user._id.toString(), firebaseUid: user.firebaseUid, name: user.name, email: user.email, role: user.role as Role, active: user.active, permissions: (user.permissions ?? []) as Permission[], patient: user.patient?.toString() };
}
async function identityFromRequest(request: NextRequest) {
  const bearer = request.headers.get("authorization")?.replace("Bearer ", "");
  if (bearer) return verifyIdToken(bearer);
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  if (!session) throw new Error("Unauthorized");
  return verifySessionCookie(session);
}
export async function getRequestUser(request: NextRequest) { return findActiveUser((await identityFromRequest(request)).uid); }
export async function requirePermission(request: NextRequest, permission: Permission) { const user = await getRequestUser(request); if (!hasPermission(user.role, permission, user.permissions)) throw new Error("Forbidden"); return user; }
export async function getServerSessionUser() { const session = (await cookies()).get(SESSION_COOKIE)?.value; if (!session) return null; try { return await findActiveUser((await verifySessionCookie(session)).uid); } catch { return null; } }
