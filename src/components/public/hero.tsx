"use client";

import { ArrowRight, CalendarDays, Phone, ShieldCheck, Stethoscope } from "lucide-react";
import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";

export function Hero() {
  const root = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      gsap.from("[data-hero-item]", { y: 24, opacity: 0, duration: .7, stagger: .1, ease: "power3.out" });
      gsap.to("[data-orbit]", { y: -10, duration: 3, repeat: -1, yoyo: true, ease: "sine.inOut" });
    }, root);
    return () => context.revert();
  }, []);

  return <section ref={root} className="relative isolate overflow-hidden bg-canvas">
    <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_75%_15%,#e3f0ed_0,transparent_55%),radial-gradient(ellipse_at_5%_85%,#fbeae5_0,transparent_45%)]" />
    <div className="mx-auto grid max-w-7xl gap-14 px-5 pb-20 pt-16 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:pb-28 lg:pt-24">
      <div className="self-center">
        <p data-hero-item className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand/15 bg-brand-soft px-4 py-1.5 text-sm font-medium text-brand-strong"><ShieldCheck size={16} /> Care you can count on</p>
        <h1 data-hero-item className="max-w-2xl font-display text-5xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-[4.25rem]">Better health begins with <span className="text-brand">being heard.</span></h1>
        <p data-hero-item className="mt-7 max-w-xl text-lg leading-8 text-ink-muted">Modern medicine with a human heart. Our specialists and emergency teams are here to help you feel your best, every day.</p>
        <div data-hero-item className="mt-9 flex flex-wrap gap-3">
          <Link href="/appointments" className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3.5 font-semibold text-white transition hover:bg-brand-strong">Book an appointment <ArrowRight size={18} /></Link>
          <Link href="/services" className="inline-flex items-center rounded-full border border-line bg-surface px-6 py-3.5 font-semibold text-ink transition hover:bg-surface-sunken">Explore services</Link>
        </div>
        <dl data-hero-item className="mt-14 grid max-w-lg grid-cols-3 gap-6 border-t border-line pt-8">
          {[["25+", "Specialists"], ["24/7", "Emergency care"], ["15k+", "Patients cared for"]].map(([value, label]) => (
            <div key={label}><dt className="sr-only">{label}</dt><dd><span className="block font-display text-3xl font-semibold text-ink">{value}</span><span className="mt-1 block text-sm text-ink-muted">{label}</span></dd></div>
          ))}
        </dl>
      </div>

      <div className="relative mx-auto w-full max-w-md self-center lg:mx-0">
        <div className="relative overflow-hidden rounded-[2rem] bg-brand p-8 text-white shadow-[0_32px_64px_-24px_rgba(15,92,86,.5)]">
          <div aria-hidden className="absolute -right-12 -top-12 size-44 rounded-full border-[22px] border-white/10" />
          <div className="relative grid gap-8">
            <span className="grid size-14 place-items-center rounded-2xl bg-white text-brand"><Stethoscope size={28} /></span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-brand-bright">Your health, simplified</p>
              <p className="mt-2 font-display text-3xl font-semibold leading-tight">Care designed around you.</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="flex items-center gap-2 text-sm text-white/80"><CalendarDays size={17} /> Quick appointments</p>
              <p className="mt-1 font-semibold">Choose your time. We’ll confirm it.</p>
            </div>
          </div>
        </div>
        <div data-orbit className="absolute -bottom-6 -left-4 rounded-2xl border border-line bg-surface p-4 shadow-[0_16px_40px_-16px_rgba(28,25,23,.25)] sm:-left-8">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent"><Phone size={13} />Emergency</p>
          <a href="tel:+913340002000" className="mt-1 block font-display text-xl font-semibold text-ink">+91 33 4000 2000</a>
        </div>
      </div>
    </div>
  </section>;
}
