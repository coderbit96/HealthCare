import Image from "next/image";
import { Ambulance, Clock3, HeartPulse, Pill, ScanLine, ShieldCheck } from "lucide-react";
import { PageShell } from "@/components/public/page-shell";
import { Reveal } from "@/components/public/reveal";
import { SITE_IMAGES } from "@/lib/site-content";

export const metadata = { title: "Hospital facilities", description: "Explore our modern hospital facilities, diagnostics, emergency support and patient-focused spaces." };

const facilities = [
  { icon: Ambulance, title: "24/7 emergency care", text: "Rapid assessment and coordinated emergency response, day and night." },
  { icon: ScanLine, title: "Advanced diagnostics", text: "Imaging, pathology and screening designed for timely, reliable answers." },
  { icon: HeartPulse, title: "Critical care support", text: "Close monitoring and specialist-led care for patients who need it most." },
  { icon: Pill, title: "In-house pharmacy", text: "Convenient access to prescribed medicines and clear guidance before you go home." },
  { icon: ShieldCheck, title: "Safe clinical spaces", text: "Thoughtfully maintained spaces built around patient comfort and safety." },
  { icon: Clock3, title: "Comfortable recovery", text: "Calm patient areas and attentive support for every stage of your visit." },
];

export default function Facilities() {
  return <PageShell><main className="bg-canvas">
    <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[1fr_.9fr] lg:px-8 lg:py-24">
      <Reveal className="self-center"><p className="text-sm font-bold uppercase tracking-[.2em] text-brand">Our facilities</p><h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">Designed for calm, built for care.</h1><p className="mt-6 max-w-xl text-lg leading-8 text-ink-muted">From first consultation to recovery, our hospital brings modern clinical capability and a welcoming environment together in one place.</p><div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-brand/15 bg-white px-4 py-3 text-sm font-semibold text-brand shadow-sm"><ShieldCheck size={20} />Patient-first spaces and standards</div></Reveal>
      <Reveal delay={.1}><div className="relative min-h-80 overflow-hidden rounded-[2rem] shadow-[0_28px_60px_-30px_rgba(15,92,86,.55)]"><Image src={SITE_IMAGES.hospital} alt="Welcoming modern hospital facility" fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 45vw" /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent p-7 text-white"><p className="text-sm font-bold uppercase tracking-[.16em] text-brand-bright">One reassuring setting</p><p className="mt-2 font-display text-2xl font-semibold">Care that feels considered from every angle.</p></div></div></Reveal>
    </section>
    <section className="border-y border-line bg-white"><div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20"><Reveal><p className="text-sm font-bold uppercase tracking-[.2em] text-brand">Here for every need</p><h2 className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">Everything you need for a supported visit.</h2></Reveal><div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{facilities.map(({ icon: Icon, title, text }, index) => <Reveal key={title} delay={index * .05}><article className="h-full rounded-2xl border border-line bg-canvas p-6 transition duration-300 hover:-translate-y-1 hover:border-brand/25 hover:shadow-lg hover:shadow-brand/10"><span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand"><Icon size={22} /></span><h3 className="mt-5 font-display text-xl font-semibold text-ink">{title}</h3><p className="mt-2 leading-7 text-ink-muted">{text}</p></article></Reveal>)}</div></div></section>
  </main></PageShell>;
}
