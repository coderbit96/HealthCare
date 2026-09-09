/**
 * Creates local-development demo accounts for every supported hospital role.
 *
 * This script changes Firebase Authentication credentials and MongoDB user records.
 * It is intentionally driven by the ignored .env.local file: never put demo passwords
 * in source control or run it against a production Firebase/MongoDB project.
 */
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import mongoose from "mongoose";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
}

const password = process.env.DEMO_PASSWORD;
if (!password || password.length < 8) {
  console.error("DEMO_PASSWORD must be set in .env.local and contain at least 8 characters.");
  process.exit(1);
}

const rawCredentials = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || (process.env.FIREBASE_SERVICE_ACCOUNT_PATH ? readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, "utf8") : undefined);
if (!rawCredentials || !process.env.MONGODB_URI) {
  console.error("MongoDB and Firebase Admin credentials must be configured in .env.local.");
  process.exit(1);
}

const demos = [
  { role: "doctor", name: "Dr. Asha Mehta", email: process.env.DEMO_DOCTOR_EMAIL || "doctor@healthcare.demo" },
  { role: "nurse", name: "Nurse Priya Das", email: process.env.DEMO_NURSE_EMAIL || "nurse@healthcare.demo" },
  { role: "receptionist", name: "Reception Desk", email: process.env.DEMO_RECEPTIONIST_EMAIL || "reception@healthcare.demo" },
  { role: "hr", name: "HR Manager", email: process.env.DEMO_HR_EMAIL || "hr@healthcare.demo" },
  { role: "lab_technician", name: "Lab Technician", email: process.env.DEMO_LAB_TECHNICIAN_EMAIL || "lab@healthcare.demo" },
  { role: "pharmacist", name: "Pharmacist", email: process.env.DEMO_PHARMACIST_EMAIL || "pharmacy@healthcare.demo" },
  { role: "patient", name: "Demo Patient", email: process.env.DEMO_PATIENT_EMAIL || "patient@healthcare.demo" },
];

const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(JSON.parse(rawCredentials)) });
const auth = getAuth(app);
await mongoose.connect(process.env.MONGODB_URI);

try {
  const users = mongoose.connection.collection("users");
  const patients = mongoose.connection.collection("patients");
  const now = new Date();

  for (const demo of demos) {
    const email = demo.email.trim().toLowerCase();
    let firebaseUser;
    try {
      firebaseUser = await auth.getUserByEmail(email);
      firebaseUser = await auth.updateUser(firebaseUser.uid, { password, emailVerified: true, displayName: demo.name });
    } catch (error) {
      if (error.code !== "auth/user-not-found") throw error;
      firebaseUser = await auth.createUser({ email, password, emailVerified: true, displayName: demo.name });
    }

    const baseUser = { firebaseUid: firebaseUser.uid, name: demo.name, email, role: demo.role, active: true, status: "active", permissions: [], updatedAt: now };
    await users.updateOne({ email }, { $set: baseUser, $setOnInsert: { createdAt: now }, ...(demo.role === "patient" ? {} : { $unset: { patient: "" } }) }, { upsert: true });

    if (demo.role === "patient") {
      let patient = await patients.findOne({ email }, { projection: { _id: 1 } });
      if (!patient) {
        const suffix = randomBytes(5).toString("hex").toUpperCase();
        const inserted = await patients.insertOne({ patientId: `DEMO-${suffix}`, uhid: `UHID-DEMO-${suffix}`, name: demo.name, email, phone: "+910000000000", createdAt: now, updatedAt: now });
        patient = { _id: inserted.insertedId };
      }
      await users.updateOne({ email }, { $set: { patient: patient._id, updatedAt: now } });
    }

    console.log(`Ready: ${demo.role.padEnd(15)} ${email}`);
  }

  console.log("\nAll demo accounts are ready. Their shared password is DEMO_PASSWORD from .env.local.");
} finally {
  await mongoose.disconnect();
}
