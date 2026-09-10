"use client";

import { EmailAuthProvider, reauthenticateWithCredential, updateEmail } from "firebase/auth";
import Image from "next/image";
import { ArrowLeft, Camera, LoaderCircle, Save, Trash2 } from "lucide-react";
import { type ChangeEvent, type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import type { AuthenticatedUser } from "@/lib/server-auth";

type ProfileForm = {
  name: string;
  email: string;
  phone: string;
  department: string;
  profileImage: string;
};

const MAX_PROFILE_IMAGE_BYTES = 10 * 1024 * 1024;

export function AdminProfilePage({ user }: { user: AuthenticatedUser }) {
  const router = useRouter();
  const [form, setForm] = useState<ProfileForm>({
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    department: user.department ?? "",
    profileImage: user.profileImage ?? "",
  });
  const [emailPassword, setEmailPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();

  const emailChanged = form.email.trim().toLowerCase() !== user.email.toLowerCase();

  const chooseImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setMessage(undefined);
    setError(undefined);
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      setError("Use a PNG, JPEG, or WebP image.");
      return;
    }
    if (file.size > MAX_PROFILE_IMAGE_BYTES) {
      setError("Choose an image smaller than 10 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setForm((current) => ({ ...current, profileImage: typeof reader.result === "string" ? reader.result : current.profileImage }));
    reader.onerror = () => setError("The selected image could not be read.");
    reader.readAsDataURL(file);
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(undefined);
    setError(undefined);

    if (form.name.trim().length < 2) {
      setError("Enter your full name.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (emailChanged && !emailPassword) {
      setError("Enter your current password to change the administrator email.");
      return;
    }

    setSaving(true);
    try {
      if (emailChanged) {
        if (!auth?.currentUser?.email) throw new Error("Your Firebase administrator session is unavailable. Sign in again before changing email.");
        const credential = EmailAuthProvider.credential(auth.currentUser.email, emailPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
        await updateEmail(auth.currentUser, form.email.trim().toLowerCase());
        const idToken = await auth.currentUser.getIdToken(true);
        const sessionResponse = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
        if (!sessionResponse.ok) throw new Error("Email was updated, but the secure portal session could not be refreshed. Please sign in again.");
      }

      const response = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, name: form.name.trim(), email: form.email.trim().toLowerCase(), phone: form.phone.trim(), department: form.department.trim() }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to save your profile.");
      setForm((current) => ({ ...current, ...payload }));
      setEmailPassword("");
      setMessage("Your administrator profile has been updated.");
      router.refresh();
    } catch (saveError) {
      const code = typeof saveError === "object" && saveError && "code" in saveError ? String(saveError.code) : "";
      setError(code === "auth/invalid-credential" || code === "auth/wrong-password" ? "Your current password is incorrect." : saveError instanceof Error ? saveError.message : "Unable to save your profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <div><p className="text-xs font-semibold uppercase tracking-[.14em] text-brand">Administrator account</p><h1 className="mt-1 font-display text-2xl font-semibold">My profile</h1></div>
          <button type="button" onClick={() => router.push("/portal/dashboard")} className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold text-brand-strong transition hover:bg-brand-soft"><ArrowLeft size={16} />Dashboard</button>
        </div>
      </header>

      <form onSubmit={saveProfile} className="mx-auto grid max-w-5xl gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[280px_1fr]">
        <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold">Profile photo</p>
          <div className="mt-5 grid size-36 place-items-center overflow-hidden rounded-full bg-brand-soft text-4xl font-display font-semibold text-brand-strong">
            {form.profileImage ? <Image src={form.profileImage} alt="Administrator profile" width={144} height={144} unoptimized className="size-full object-cover" /> : form.name.slice(0, 2).toUpperCase()}
          </div>
          <label className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong"><Camera size={16} />Upload image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseImage} className="sr-only" /></label>
          {form.profileImage && <button type="button" onClick={() => setForm((current) => ({ ...current, profileImage: "" }))} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-critical transition hover:underline"><Trash2 size={15} />Remove image</button>}
        </section>

        <section className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
          <div><p className="text-xs font-semibold uppercase tracking-[.14em] text-brand">Account details</p><h2 className="mt-2 font-display text-2xl font-semibold">Edit administrator profile</h2><p className="mt-2 text-sm leading-6 text-ink-muted">Keep your contact and role information accurate for hospital operations.</p></div>
          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <ProfileField label="Full name"><input required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="profile-input" /></ProfileField>
            <ProfileField label="Phone number"><input type="tel" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} className="profile-input" /></ProfileField>
            <ProfileField label="Email address" full><input required type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="profile-input" /></ProfileField>
            <ProfileField label="Department"><input value={form.department} onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))} placeholder="Administration" className="profile-input" /></ProfileField>
            <ProfileField label="Account role"><input value="Administrator" readOnly className="profile-input cursor-not-allowed opacity-70" /></ProfileField>
          </div>
          {emailChanged && <ProfileField label="Current password to confirm email change" className="mt-5"><input type="password" autoComplete="current-password" required value={emailPassword} onChange={(event) => setEmailPassword(event.target.value)} className="profile-input" /></ProfileField>}
          {message && <p role="status" className="mt-6 rounded-xl bg-brand-soft px-4 py-3 text-sm font-medium text-brand-strong">{message}</p>}
          {error && <p role="alert" className="mt-6 rounded-xl bg-critical/10 px-4 py-3 text-sm font-medium text-critical">{error}</p>}
          <button type="submit" disabled={saving} className="mt-7 inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60">{saving ? <LoaderCircle className="animate-spin" size={17} /> : <Save size={17} />}{saving ? "Saving profile…" : "Save profile"}</button>
        </section>
      </form>
    </main>
  );
}

function ProfileField({ label, children, full, className = "" }: { label: string; children: React.ReactNode; full?: boolean; className?: string }) {
  return <label className={`grid gap-1.5 text-sm font-semibold ${full ? "sm:col-span-2" : ""} ${className}`}>{label}{children}</label>;
}
