import Link from "next/link";
import { PageShell } from "@/components/public/page-shell";
import { PatientRegister } from "@/components/portal/patient-register";
export default function Register() { return <PageShell><main className="grid min-h-[65vh] place-items-center bg-canvas p-5"><div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-sm"><h1 className="text-3xl font-semibold">Patient access</h1><p className="mt-3 leading-6 text-ink-muted">Create and verify your Firebase account. The hospital then securely links it to your patient profile before records are available.</p><PatientRegister /><Link className="mt-6 inline-block text-sm font-semibold text-brand" href="/appointments">Request an appointment instead</Link></div></main></PageShell>; }
