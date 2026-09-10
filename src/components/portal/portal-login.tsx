"use client";

import { GoogleAuthProvider, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, User } from "firebase/auth";
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, ShieldCheck, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { auth, isFirebaseConfigured } from "@/lib/firebase";

const inputClass = "w-full rounded-xl border border-line bg-surface py-3.5 pl-11 pr-4 text-sm font-medium text-ink outline-none transition placeholder:font-normal placeholder:text-ink-subtle hover:border-brand-bright/50 focus:border-brand-bright focus:ring-4 focus:ring-brand-bright/10";

export function PortalLogin({ adminOnly = false }: { adminOnly?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; title: string; message: string }>();

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(undefined), 5000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const createSession = async (user: User) => {
    const response = await fetch("/api/auth/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idToken: await user.getIdToken(true) }) });
    const rawPayload = await response.text();
    let payload: { error?: string; role?: string; name?: string } = {};
    try {
      payload = rawPayload ? JSON.parse(rawPayload) as { error?: string; role?: string; name?: string } : {};
    } catch {
      // An upstream platform error may return an empty or non-JSON response.
    }
    if (!response.ok) {
      throw new Error(payload.error ?? (response.status >= 500 ? "The secure sign-in service is temporarily unavailable. Please try again shortly." : "Unable to create a secure sign-in session."));
    }
    if (adminOnly && payload.role !== "admin") {
      await fetch("/api/auth/session", { method: "DELETE" });
      throw new Error("This sign-in page is restricted to hospital administrators.");
    }
    setFeedback({ tone: "success", title: "Login successful", message: "Welcome back. Taking you to your workspace…" });
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    router.replace(payload.role === "patient" ? "/portal/patient" : "/portal/dashboard");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!auth) return;
    setLoading(true);
    setError(undefined);
    try { await createSession((await signInWithEmailAndPassword(auth, email, password)).user); }
    catch (cause) { const text = cause instanceof Error ? cause.message : "We could not sign you in."; setError(text); setFeedback({ tone: "error", title: "Invalid login", message: "Please check your email and password, then try again." }); }
    finally { setLoading(false); }
  };

  const google = async () => {
    if (!auth) return;
    setLoading(true);
    setError(undefined);
    try { await createSession((await signInWithPopup(auth, new GoogleAuthProvider())).user); }
    catch (cause) { const text = cause instanceof Error ? cause.message : "We could not sign you in."; setError(text); setFeedback({ tone: "error", title: "Invalid login", message: "We could not complete this sign-in. Please try again." }); }
    finally { setLoading(false); }
  };

  const reset = async () => {
    if (!auth || !email) return setError("Enter your email address first.");
    try { await sendPasswordResetEmail(auth, email); setMessage("Password reset email sent. Please check your inbox."); }
    catch { setError("Unable to send a password reset email."); }
  };

  return (
    <>
      {feedback && <div className={`fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-2xl sm:w-96 ${feedback.tone === "success" ? "border-positive/25 bg-emerald-50 text-positive" : "border-critical/25 bg-red-50 text-critical"}`} role={feedback.tone === "error" ? "alert" : "status"} aria-live="polite"><span className={`grid size-8 shrink-0 place-items-center rounded-full ${feedback.tone === "success" ? "bg-positive/15" : "bg-critical/15"}`}>{feedback.tone === "success" ? <CheckCircle2 size={19} /> : <XCircle size={19} />}</span><span className="flex-1"><span className="block font-bold">{feedback.title}</span><span className="mt-0.5 block leading-5 opacity-85">{feedback.message}</span></span></div>}
    <div className="rounded-[1.75rem] border border-white/70 bg-white p-6 text-ink shadow-[0_24px_70px_rgba(2,34,32,.28)] sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand"><ShieldCheck size={24} /></div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-positive/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[.11em] text-positive"><span className="size-1.5 rounded-full bg-positive" /> Secure</span>
      </div>

      <div className="mt-6">
        {adminOnly && <p className="text-xs font-bold uppercase tracking-[.16em] text-brand">Administrator portal</p>}
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-[2rem]">Welcome back</h1>
        <p className="mt-2 text-sm leading-6 text-ink-muted">Sign in to access your authorised hospital workspace.</p>
      </div>

      {isFirebaseConfigured ? (
        <form className="mt-7 space-y-5" onSubmit={submit}>
          <label className="block text-sm font-semibold text-ink" htmlFor="portal-email">
            Email address
            <span className="relative mt-2 block">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle" size={18} />
              <input id="portal-email" className={inputClass} type="email" autoComplete="email" required placeholder="name@hospital.com" value={email} onChange={(event) => setEmail(event.target.value)} />
            </span>
          </label>

          <label className="block text-sm font-semibold text-ink" htmlFor="portal-password">
            <span className="flex items-center justify-between gap-3">Password<button type="button" onClick={reset} className="text-xs font-bold text-brand transition hover:text-brand-strong">Forgot password?</button></span>
            <span className="relative mt-2 block">
              <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle" size={18} />
              <input id="portal-password" className={`${inputClass} pr-11`} type={showPassword ? "text" : "password"} autoComplete="current-password" required placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} />
              <button type="button" className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-ink-subtle transition hover:bg-surface-sunken hover:text-ink" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </span>
          </label>

          <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-strong focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-bright/35 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? <LoaderCircle className="animate-spin" size={18} /> : <>Sign in securely <ArrowRight size={18} /></>}
          </button>
        </form>
      ) : (
        <div className="mt-7 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><AlertCircle className="mt-0.5 shrink-0" size={18} />Firebase is not configured. Contact your system administrator.</div>
      )}

      {!adminOnly && <><div className="my-6 flex items-center gap-3 text-xs font-medium text-ink-subtle"><span className="h-px flex-1 bg-line" />or continue with<span className="h-px flex-1 bg-line" /></div><button type="button" onClick={google} disabled={loading || !isFirebaseConfigured} className="flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-white px-4 py-3 text-sm font-bold text-ink transition hover:border-brand-bright/50 hover:bg-brand-soft/40 disabled:cursor-not-allowed disabled:opacity-60"><span className="grid size-5 place-items-center rounded-full bg-[#4285F4] font-sans text-[11px] font-bold text-white">G</span>Continue with Google</button></>}

      {error && <p role="alert" className="mt-5 flex gap-2 rounded-xl bg-critical/10 p-3 text-sm leading-5 text-critical"><AlertCircle className="mt-0.5 shrink-0" size={17} />{error}</p>}
      {message && <p role="status" className="mt-5 rounded-xl bg-brand-soft p-3 text-sm leading-5 text-brand-strong">{message}</p>}
      {adminOnly ? <p className="mt-7 border-t border-line pt-5 text-center text-xs leading-5 text-ink-muted">Restricted to authorised hospital administrators.</p> : <p className="mt-7 border-t border-line pt-5 text-center text-xs leading-5 text-ink-muted">Need a patient account? <Link className="font-bold text-brand transition hover:text-brand-strong" href="/register">Register and verify email</Link>.</p>}
    </div>
    </>
  );
}
