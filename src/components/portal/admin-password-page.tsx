"use client";

import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { ArrowLeft, Eye, EyeOff, KeyRound, LoaderCircle } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

type PasswordField = "current" | "next" | "confirm";

export function AdminPasswordPage() {
  const router = useRouter();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [visible, setVisible] = useState<Record<PasswordField, boolean>>({ current: false, next: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();

  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(undefined);
    setError(undefined);
    if (form.next.length < 6) return setError("Your new password must contain at least 6 characters.");
    if (form.next !== form.confirm) return setError("The new password and confirmation do not match.");
    if (!auth?.currentUser?.email) return setError("Password changes are unavailable until this administrator session is fully verified.");

    setSaving(true);
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, form.current);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, form.next);
      const idToken = await auth.currentUser.getIdToken(true);
      const response = await fetch("/api/auth/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken }) });
      if (!response.ok) throw new Error("Your password was updated, but the portal session could not be refreshed. Please sign in again.");
      setForm({ current: "", next: "", confirm: "" });
      setMessage("Password changed successfully. Your previous password no longer works.");
    } catch (passwordError) {
      const code = typeof passwordError === "object" && passwordError && "code" in passwordError ? String(passwordError.code) : "";
      setError(code === "auth/invalid-credential" || code === "auth/wrong-password" ? "Your current password is incorrect." : code === "auth/weak-password" ? "Please choose a stronger password." : passwordError instanceof Error ? passwordError.message : "We could not update your password. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const field = (key: PasswordField, label: string, autoComplete: string) => <label className="grid gap-1.5 text-sm font-semibold">{label}<span className="relative block"><input type={visible[key] ? "text" : "password"} autoComplete={autoComplete} minLength={key === "current" ? undefined : 6} required value={form[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 pr-11 font-normal outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15" /><button type="button" onClick={() => setVisible((current) => ({ ...current, [key]: !current[key] }))} aria-label={visible[key] ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} aria-pressed={visible[key]} className="absolute inset-y-0 right-0 grid w-11 place-items-center text-ink-subtle transition hover:text-brand-strong">{visible[key] ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>;

  return <main className="min-h-screen bg-canvas text-ink"><header className="border-b border-line bg-white"><div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-5 py-5 sm:px-8"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-brand">Administrator account</p><h1 className="mt-1 font-display text-2xl font-semibold">Change password</h1></div><button type="button" onClick={() => router.push("/portal/dashboard")} className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold text-brand-strong transition hover:bg-brand-soft"><ArrowLeft size={16} />Dashboard</button></div></header><form onSubmit={changePassword} className="mx-auto max-w-2xl px-5 py-8 sm:px-8"><section className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8"><span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand"><KeyRound size={20} /></span><h2 className="mt-5 font-display text-2xl font-semibold">Set a new password</h2><p className="mt-2 leading-7 text-ink-muted">Confirm your current password before replacing it. The old password will stop working immediately.</p><div className="mt-7 grid gap-5">{field("current", "Current password", "current-password")}{field("next", "New password", "new-password")}{field("confirm", "Confirm new password", "new-password")}</div>{message && <p role="status" className="mt-6 rounded-xl bg-brand-soft px-4 py-3 text-sm font-medium text-brand-strong">{message}</p>}{error && <p role="alert" className="mt-6 rounded-xl bg-critical/10 px-4 py-3 text-sm font-medium text-critical">{error}</p>}<button type="submit" disabled={saving} className="mt-7 inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60">{saving && <LoaderCircle className="animate-spin" size={17} />}{saving ? "Updating password…" : "Update password"}</button></section></form></main>;
}
