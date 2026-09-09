/**
 * Creates (or repairs) the first hospital administrator account.
 *
 * An admin exists in two places and this script keeps them in sync:
 *   1. Firebase Authentication — owns the email/password credential.
 *   2. MongoDB `users` collection — owns the role/permissions the app authorises against.
 *
 * Usage:
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='<strong password>' node scripts/seed-admin.mjs
 *
 * ADMIN_PASSWORD is read from the environment and never written to disk. Omit it and a
 * strong password is generated and printed once. Safe to re-run: an existing account is
 * updated in place rather than duplicated.
 */
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import mongoose from "mongoose";

const envFile = ".env.local";
for (const line of readFileSync(envFile, "utf8").split("\n")) {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
}

const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const previousEmail = (process.env.ADMIN_PREVIOUS_EMAIL || "").trim().toLowerCase();
const name = process.env.ADMIN_NAME || "Hospital Administrator";
if (!email) { console.error("ADMIN_EMAIL is required."); process.exit(1); }

// Firebase rejects passwords under 6 characters. Production passwords should be much stronger.
const generated = !process.env.ADMIN_PASSWORD;
const password = process.env.ADMIN_PASSWORD || randomBytes(12).toString("base64url");
if (password.length < 6) { console.error("ADMIN_PASSWORD must be at least 6 characters."); process.exit(1); }

const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || (process.env.FIREBASE_SERVICE_ACCOUNT_PATH ? readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, "utf8") : undefined);
if (!raw) { console.error("Firebase Admin credentials missing (FIREBASE_SERVICE_ACCOUNT_JSON or _PATH)."); process.exit(1); }
const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(JSON.parse(raw)) });
const auth = getAuth(app);

let firebaseUser;
try {
  firebaseUser = await auth.getUserByEmail(email);
  // Existing credential: reset the password and force email_verified, which sign-in requires.
  firebaseUser = await auth.updateUser(firebaseUser.uid, { password, emailVerified: true, displayName: name });
  console.log(`Updated existing Firebase user ${email}`);
} catch (error) {
  if (error.code !== "auth/user-not-found") throw error;
  if (previousEmail && previousEmail !== email) {
    try {
      const previousUser = await auth.getUserByEmail(previousEmail);
      firebaseUser = await auth.updateUser(previousUser.uid, { email, password, emailVerified: true, displayName: name });
      console.log(`Migrated Firebase user ${previousEmail} to ${email}`);
    } catch (previousError) {
      if (previousError.code !== "auth/user-not-found") throw previousError;
    }
  }
  if (!firebaseUser) {
    firebaseUser = await auth.createUser({ email, password, emailVerified: true, displayName: name });
    console.log(`Created Firebase user ${email}`);
  }
}

await mongoose.connect(process.env.MONGODB_URI);
const users = mongoose.connection.collection("users");
const now = new Date();
await users.updateOne(
  { firebaseUid: firebaseUser.uid },
  {
    $set: { firebaseUid: firebaseUser.uid, name, email, role: "admin", active: true, status: "active", permissions: [], updatedAt: now },
    $setOnInsert: { createdAt: now },
  },
  { upsert: true },
);
if (previousEmail && previousEmail !== email) {
  const previousRecord = await users.findOne({ email: previousEmail }, { projection: { firebaseUid: 1 } });
  if (previousRecord?.firebaseUid && previousRecord.firebaseUid !== firebaseUser.uid) {
    await users.updateOne({ _id: previousRecord._id }, { $set: { active: false, status: "inactive", updatedAt: now } });
    try {
      await auth.updateUser(previousRecord.firebaseUid, { disabled: true });
      console.log(`Retired previous demo administrator ${previousEmail}`);
    } catch (error) {
      if (error.code !== "auth/user-not-found") throw error;
    }
  }
}
console.log(`Linked MongoDB user record (role: admin)`);
await mongoose.disconnect();

console.log("\nAdmin ready. Sign in at /portal/login");
console.log(`  Email:    ${email}`);
if (generated) console.log(`  Password: ${password}\n\nSave this now — it is not stored anywhere.`);
else console.log("  Password: (the ADMIN_PASSWORD you supplied)");
