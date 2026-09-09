import Link from "next/link";
import { ArrowLeft, CheckCircle2, HeartPulse, LockKeyhole, ShieldCheck, Stethoscope } from "lucide-react";
import { PortalLogin } from "@/components/portal/portal-login";
import { Brand } from "@/components/public/brand";

export const metadata = { title: "Staff portal | Health Care .Pvt .Ltd" };

const assurances = ["Role-based access control", "Protected clinical information", "Audit-ready activity records"];

export default function Login({ adminOnly = false }: { adminOnly?: boolean }) {
  const portalLabel = adminOnly ? "ADMINISTRATOR ACCESS" : "HOSPITAL ACCESS";
  const heading = adminOnly ? "Administrator access." : "Your care, connected.";
  const description = adminOnly ? "Secure access for authorised hospital administrators." : "One secure place for hospital teams and patients.";
  const accessNote = adminOnly ? "Protected workspace · For authorised administrators only" : "Protected workspace · For authorised hospital users only";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#062f2c] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_15%,rgba(48,188,172,.24),transparent_24%),radial-gradient(circle_at_88%_86%,rgba(59,174,212,.22),transparent_28%),linear-gradient(135deg,#083d39_0%,#062f2c_48%,#082a35_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[.13] [background-image:linear-gradient(rgba(255,255,255,.22)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.22)_1px,transparent_1px)] [background-size:42px_42px]" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1.05fr_.95fr]">
        <section className="hidden flex-col justify-between px-10 py-10 lg:flex xl:px-16 xl:py-14">
          <Brand light />

          <div className="max-w-xl pb-8">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-teal-100 backdrop-blur">
              <span className="size-1.5 rounded-full bg-teal-300 shadow-[0_0_0_4px_rgba(94,234,212,.12)]" />
              {portalLabel}
            </div>
            <h1 className={`font-display font-semibold leading-[1.04] tracking-tight text-white ${adminOnly ? "max-w-lg text-5xl xl:text-[4.5rem]" : "text-5xl xl:text-6xl"}`}>{heading}</h1>
            {!adminOnly && <p className="mt-6 max-w-lg text-base leading-7 text-teal-50/75 xl:text-lg">{description}</p>}

            {adminOnly ? <div className="relative mt-10 h-40 max-w-md overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[.055] shadow-2xl shadow-black/10 backdrop-blur-sm">
              <div className="absolute -right-8 -top-14 size-52 rounded-full border border-teal-200/15" />
              <div className="absolute -right-2 -top-8 size-36 rounded-full border border-teal-200/10" />
              <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-teal-200/0 via-teal-200/35 to-teal-200/0" />
              <div className="relative flex h-full items-center gap-5 px-6">
                <span className="grid size-20 shrink-0 place-items-center rounded-3xl border border-teal-100/20 bg-gradient-to-br from-teal-200/20 to-white/[.03] text-teal-200 shadow-[inset_0_1px_0_rgba(255,255,255,.16)]"><LockKeyhole size={34} strokeWidth={1.7} /></span>
                <div className="h-12 w-px bg-white/10" />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[.2em] text-teal-200/75">Health Care .Pvt .Ltd</p>
                  <p className="mt-2 font-display text-2xl font-semibold text-white">Private workspace</p>
                </div>
              </div>
            </div> : <div className="mt-10 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {assurances.map((assurance) => (
                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[.07] p-3.5 text-sm font-medium leading-5 text-teal-50/90 backdrop-blur-sm" key={assurance}>
                  <CheckCircle2 className="mt-0.5 shrink-0 text-teal-300" size={17} />
                  {assurance}
                </div>
              ))}
            </div>}
          </div>

          {!adminOnly && <div className="flex items-center gap-3 text-sm text-teal-50/60">
            <span className="grid size-9 place-items-center rounded-xl border border-white/10 bg-white/[.08]"><Stethoscope size={18} /></span>
            <span>Health Care .Pvt .Ltd &mdash; care that feels human.</span>
          </div>}
        </section>

        <section className="relative flex min-h-screen flex-col px-5 py-6 sm:px-8 lg:border-l lg:border-white/10 lg:bg-white/[.035] lg:px-12 lg:py-10 xl:px-16">
          <div className="lg:hidden"><Brand light /></div>
          <div className="flex flex-1 items-center justify-center py-10 lg:py-0">
            <div className="w-full max-w-md">
              <div className="mb-5 flex items-center gap-3 text-sm text-teal-50/70 lg:hidden">
                <span className="grid size-9 place-items-center rounded-xl bg-white/10 text-teal-200"><ShieldCheck size={18} /></span>
                Secure staff access
              </div>
              <PortalLogin adminOnly={adminOnly} />
              <Link className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-teal-50/75 transition hover:text-white" href="/">
                <ArrowLeft size={17} />
                Back to hospital website
              </Link>
            </div>
          </div>
          <p className="hidden text-xs text-teal-50/50 lg:block">{accessNote}</p>
        </section>
      </div>

      <div className="pointer-events-none absolute -bottom-20 -left-20 hidden size-64 rounded-full border border-teal-200/10 lg:block" />
      <div className="pointer-events-none absolute right-[44%] top-16 hidden size-16 rounded-2xl border border-white/10 bg-white/[.06] p-4 text-teal-200 shadow-2xl backdrop-blur lg:block"><HeartPulse size={31} /></div>
    </main>
  );
}
