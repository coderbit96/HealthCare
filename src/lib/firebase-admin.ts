import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { readFileSync } from "node:fs";

function adminApp() {
  if (getApps().length) return getApps()[0]!;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || (process.env.FIREBASE_SERVICE_ACCOUNT_PATH ? readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, "utf8") : undefined);
  if (!raw) throw new Error("Firebase Admin is not configured");
  let serviceAccount: ServiceAccount;
  try {
    serviceAccount = JSON.parse(raw) as ServiceAccount;
  } catch {
    try {
      serviceAccount = JSON.parse(Buffer.from(raw, "base64").toString("utf8")) as ServiceAccount;
    } catch {
      throw new Error("Firebase Admin credentials are invalid");
    }
  }
  return initializeApp({ credential: cert(serviceAccount) });
}

export async function verifyIdToken(token: string) {
  return getAuth(adminApp()).verifyIdToken(token);
}

export async function createFirebaseUser({ email, password, displayName }: { email: string; password: string; displayName: string }) {
  return getAuth(adminApp()).createUser({ email, password, displayName, emailVerified: true });
}

export async function deleteFirebaseUser(uid: string) {
  return getAuth(adminApp()).deleteUser(uid);
}

export async function createSessionCookie(idToken: string) { return getAuth(adminApp()).createSessionCookie(idToken, { expiresIn: 1000 * 60 * 60 * 24 * 5 }); }
export async function verifySessionCookie(cookie: string) { return getAuth(adminApp()).verifySessionCookie(cookie, true); }
