import { Clock3, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { Brand } from "./brand";

const quickLinks = [["About us", "/about"], ["Our services", "/services"], ["Find a doctor", "/doctors"], ["Health packages", "/health-packages"], ["Book an appointment", "/appointments"], ["Contact", "/contact"]];

export function SiteFooter() {
  return <footer className="mt-auto bg-brand-strong text-white/80">
    <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 lg:grid-cols-[1.6fr_1fr_1.1fr] lg:px-8">
      <div>
        <Brand light />
        <p className="mt-5 max-w-sm leading-7 text-white/70">Compassionate, evidence-led care for every chapter of life. Available when you need us most.</p>
      </div>
      <div>
        <h2 className="font-display text-lg font-semibold text-white">Quick links</h2>
        <div className="mt-4 grid gap-3 text-sm">{quickLinks.map(([label, href]) => <Link key={href} href={href} className="transition hover:text-white">{label}</Link>)}</div>
      </div>
      <div>
        <h2 className="font-display text-lg font-semibold text-white">Visit us</h2>
        <address className="mt-4 grid gap-3 text-sm not-italic">
          <p className="flex gap-2.5"><MapPin size={17} className="mt-0.5 shrink-0 text-brand-bright" />12 Wellness Avenue, Kolkata 700001</p>
          <a href="tel:+913340002000" className="flex gap-2.5 transition hover:text-white"><Phone size={17} className="mt-0.5 shrink-0 text-brand-bright" />+91 33 4000 2000</a>
          <p className="flex gap-2.5"><Clock3 size={17} className="mt-0.5 shrink-0 text-brand-bright" />24/7 emergency care</p>
        </address>
      </div>
    </div>
    <div className="border-t border-white/10 px-5 py-5 text-center text-xs text-white/50">© {new Date().getFullYear()} Health Care .Pvt .Ltd. All rights reserved.</div>
  </footer>;
}
