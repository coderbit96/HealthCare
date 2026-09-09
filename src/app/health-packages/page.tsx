import { ArrowRight, CheckCircle2, HeartPulse, ShieldPlus, Sparkles } from "lucide-react";
import Link from "next/link";
import { PageShell } from "@/components/public/page-shell";
import { Reveal } from "@/components/public/reveal";

export const metadata = { title: "Health Packages | Health Care .Pvt .Ltd" };

const packages = [
  { icon: Sparkles, name: "Essential Wellness", price: "₹1,999", copy: "A considered annual check-up for everyday confidence.", includes: ["Physician consultation", "Basic blood profile", "Blood pressure and BMI review"] },
  { icon: HeartPulse, name: "Heart Health", price: "₹4,500", copy: "Focused screening to help you understand your cardiovascular wellbeing.", includes: ["Cardiology consultation", "ECG and lipid profile", "Blood pressure review"] },
  { icon: ShieldPlus, name: "Executive Health", price: "₹7,500", copy: "Comprehensive diagnostics with time set aside for a specialist review.", includes: ["Physician consultation", "Expanded blood profile", "ECG and specialist review"] },
];

export default function HealthPackages() {
  return <PageShell><main className="bg-canvas"><section className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24"><Reveal><p className="text-sm font-bold uppercase tracking-[.2em] text-brand">Preventive care</p><h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">Health packages with a clear purpose.</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-ink-muted">Choose a simple starting point for your health. Our team can help you select the package that suits your needs.</p></Reveal><div className="mt-12 grid gap-6 lg:grid-cols-3">{packages.map((item, index) => <Reveal key={item.name} delay={index * .08}><article className="flex h-full flex-col rounded-[1.5rem] border border-line bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-xl hover:shadow-brand/10"><span className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand"><item.icon size={24} /></span><h2 className="mt-6 font-display text-2xl font-semibold text-ink">{item.name}</h2><p className="mt-3 min-h-14 leading-7 text-ink-muted">{item.copy}</p><p className="mt-6 font-display text-4xl font-semibold text-brand">{item.price}</p><p className="mt-1 text-sm text-ink-subtle">Starting price</p><ul className="mt-7 grid gap-3 border-t border-line pt-6 text-sm leading-6 text-ink-muted">{item.includes.map((feature) => <li className="flex gap-2.5" key={feature}><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-brand-bright" />{feature}</li>)}</ul><Link href="/appointments" className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-strong">Request this package <ArrowRight size={17} /></Link></article></Reveal>)}</div><Reveal><p className="mx-auto mt-10 max-w-2xl text-center text-sm leading-6 text-ink-subtle">Package inclusions are indicative and may be tailored by the clinician. Please contact our care team for preparation guidance and final pricing.</p></Reveal></section></main></PageShell>;
}
