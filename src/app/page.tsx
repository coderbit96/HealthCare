import { Activity, ArrowRight, Brain, HeartPulse, ShieldPlus, Sparkles, Stethoscope } from "lucide-react";
import Link from "next/link";
import { Hero } from "@/components/public/hero";
import { PageShell } from "@/components/public/page-shell";
import { Reveal } from "@/components/public/reveal";
import { Card, SectionHeading } from "@/components/ui";

const services = [
  { icon: HeartPulse, title: "Cardiology", text: "Advanced diagnosis and heartfelt cardiac care." },
  { icon: Brain, title: "Neurology", text: "Specialist care for brain, spine and nerves." },
  { icon: Activity, title: "Orthopaedics", text: "Move freely with focused bone and joint care." },
  { icon: ShieldPlus, title: "Preventive care", text: "Stay ahead with tailored health screening." },
];

const reasons = ["Specialists across major medical disciplines", "Transparent appointments and thoughtful follow-up", "24/7 emergency readiness and modern facilities"];

export default function Home() {
  return <PageShell>
    <Hero />
    <main>
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-24">
        <Reveal>
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading eyebrow="A better standard of care" title="Expert care for the people you love." />
            <Link className="inline-flex shrink-0 items-center gap-1.5 font-semibold text-brand transition hover:gap-2.5 hover:text-brand-strong" href="/services">View all services <ArrowRight size={17} /></Link>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service, i) => (
            <Reveal key={service.title} delay={i * .07}>
              <Card className="h-full transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-20px_rgba(28,25,23,.18)]">
                <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand"><service.icon size={22} /></span>
                <h3 className="mt-5 font-display text-xl font-semibold text-ink">{service.title}</h3>
                <p className="mt-2 leading-7 text-ink-muted">{service.text}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-surface-sunken">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 lg:grid-cols-2 lg:px-8 lg:py-24">
          <Reveal>
            <div className="grid aspect-[5/4] place-items-center rounded-[2rem] bg-brand p-10 text-center text-white shadow-[0_32px_64px_-28px_rgba(15,92,86,.55)]">
              <div>
                <Stethoscope className="mx-auto text-brand-bright" size={52} />
                <p className="mt-6 text-xs font-semibold uppercase tracking-[.2em] text-brand-bright">One hospital. Every need.</p>
                <p className="mt-3 font-display text-4xl font-semibold leading-tight">A team that sees the whole you.</p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={.1}>
            <SectionHeading eyebrow="Why choose us" title="Clinical excellence, made personal.">
              From your first call to recovery and beyond, our teams coordinate around a care plan that makes sense for you and your family.
            </SectionHeading>
            <ul className="mt-8 grid gap-4">
              {reasons.map((item) => <li className="flex items-start gap-3 font-medium text-ink" key={item}><Sparkles size={18} className="mt-1 shrink-0 text-brand" />{item}</li>)}
            </ul>
            <Link href="/about" className="mt-9 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 font-semibold text-white transition hover:bg-ink/90">About our hospital <ArrowRight size={17} /></Link>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-20 text-center lg:py-24">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-brand">Ready when you are</p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">Take the next step toward feeling better.</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-ink-muted">Request an appointment online or call our care team. We’ll help find the right specialist for you.</p>
          <Link className="mt-9 inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 font-semibold text-white transition hover:bg-brand-strong" href="/appointments">Request an appointment <ArrowRight size={18} /></Link>
        </Reveal>
      </section>
    </main>
  </PageShell>;
}
