import { CalendarDays, Clock3, HeartHandshake, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { Brand } from "./brand";

const exploreLinks = [["About us", "/about"], ["Our services", "/services"], ["Find a doctor", "/doctors"], ["Departments", "/departments"]];
const patientLinks = [["Book an appointment", "/appointments"], ["Health packages", "/health-packages"], ["Facilities", "/facilities"], ["Contact the care team", "/contact"]];

function FooterLinks({ title, links }: { title: string; links: string[][] }) {
  return <nav aria-label={title}>
    <h2 className="font-display text-lg font-semibold text-white">{title}</h2>
    <div className="mt-4 grid gap-3 text-sm text-white/70">{links.map(([label, href]) => <Link key={href} href={href} className="w-fit transition hover:text-white">{label}</Link>)}</div>
  </nav>;
}

export function SiteFooter() {
  return <footer className="mt-auto bg-brand-strong text-white/80">
    <div className="border-b border-white/10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-bright/20 text-brand-bright"><HeartHandshake size={23} /></span>
          <div><h2 className="font-display text-xl font-semibold text-white">Need help choosing the right care?</h2><p className="mt-1 text-sm text-white/65">Our team can help you find the right specialist or service.</p></div>
        </div>
        <Link href="/appointments" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-brand-bright px-5 py-3 text-sm font-bold text-ink transition hover:bg-teal-300"><CalendarDays size={18} />Request an appointment</Link>
      </div>
    </div>

    <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_.85fr_1fr_1.15fr] lg:px-8 lg:py-14">
      <div className="sm:col-span-2 lg:col-span-1">
        <Brand light />
        <p className="mt-5 max-w-sm leading-7 text-white/70">Compassionate, evidence-led care for every chapter of life.</p>
        <Link href="/contact" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-bright transition hover:text-teal-200">Talk to our care team <span aria-hidden="true">&rarr;</span></Link>
      </div>

      <FooterLinks title="Explore" links={exploreLinks} />
      <FooterLinks title="Patients & visitors" links={patientLinks} />

      <div>
        <h2 className="font-display text-lg font-semibold text-white">Visit & contact</h2>
        <address className="mt-4 grid gap-3 text-sm leading-6 text-white/70 not-italic">
          <p className="flex gap-2.5"><MapPin size={17} className="mt-1 shrink-0 text-brand-bright" />12 Wellness Avenue,<br />Kolkata 700001</p>
          <a href="tel:+913340002000" className="flex gap-2.5 transition hover:text-white"><Phone size={17} className="mt-0.5 shrink-0 text-brand-bright" />+91 33 4000 2000</a>
          <p className="flex gap-2.5"><Clock3 size={17} className="mt-0.5 shrink-0 text-brand-bright" />24/7 emergency care</p>
        </address>
      </div>
    </div>

    <div className="border-t border-white/10">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between lg:px-8"><p>&copy; {new Date().getFullYear()} Health Care .Pvt .Ltd. All rights reserved.</p><p>For appointments and general enquiries, call us anytime.</p></div>
    </div>
  </footer>;
}
