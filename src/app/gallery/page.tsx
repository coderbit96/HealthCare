import Image from "next/image";
import { Camera, HeartHandshake } from "lucide-react";
import { PageShell } from "@/components/public/page-shell";
import { Reveal } from "@/components/public/reveal";
import { SITE_IMAGES } from "@/lib/site-content";

export const metadata = { title: "Hospital gallery", description: "Take a look at Health Care Pvt. Ltd., our people, facilities and patient-first spaces." };

const moments = [
  { src: SITE_IMAGES.hospital, alt: "Modern hospital exterior", label: "Our hospital" },
  { src: SITE_IMAGES.care, alt: "Healthcare professional speaking with a patient", label: "Compassionate conversations" },
  { src: SITE_IMAGES.diagnostics, alt: "Clinical diagnostic equipment", label: "Modern diagnostics" },
  { src: "/images/doctors/dr-ananya-sen.png", alt: "Dr. Ananya Sen, consultant cardiologist", label: "Specialist care" },
  { src: "/images/doctors/dr-priya-mehta.png", alt: "Dr. Priya Mehta, consultant paediatrician", label: "Care for families" },
  { src: "/images/doctors/dr-vivek-nair.png", alt: "Dr. Vivek Nair, consultant physician", label: "Care team" },
];

export default function Gallery() {
  return <PageShell><main className="bg-canvas"><section className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24"><Reveal><p className="text-sm font-bold uppercase tracking-[.2em] text-brand">Our gallery</p><h1 className="mt-4 font-display text-4xl font-semibold text-ink sm:text-5xl">A closer look at care, in action.</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-ink-muted">Explore the people, spaces and technology behind your hospital experience.</p></Reveal><div className="mt-10 grid auto-rows-[16rem] gap-5 sm:grid-cols-2 lg:grid-cols-3">{moments.map((moment, index) => <Reveal className={index === 0 || index === 3 ? "sm:row-span-2" : ""} key={moment.label} delay={index * .05}><figure className="group relative h-full overflow-hidden rounded-2xl bg-surface-sunken shadow-sm"><Image src={moment.src} alt={moment.alt} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" /><figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/75 via-ink/20 to-transparent px-5 pb-5 pt-14 text-sm font-bold text-white">{moment.label}</figcaption></figure></Reveal>)}</div><Reveal><div className="mt-10 flex items-center gap-3 rounded-2xl border border-brand/15 bg-white p-5 text-ink-muted"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><HeartHandshake size={20} /></span><p className="text-sm leading-6">Every image reflects our commitment to thoughtful, patient-centred care.</p><Camera size={20} className="ml-auto shrink-0 text-brand-bright" /></div></Reveal></section></main></PageShell>;
}
