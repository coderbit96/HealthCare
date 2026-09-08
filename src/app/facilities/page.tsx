import Image from "next/image";
import { PageShell } from "@/components/public/page-shell";
import { SITE_IMAGES } from "@/lib/site-content";
export default function Facilities() { return <PageShell><main className="mx-auto max-w-6xl px-5 py-20"><div className="grid gap-10 lg:grid-cols-2"><div><p className="font-semibold uppercase tracking-widest text-brand">Facilities</p><h1 className="mt-3 text-5xl font-semibold">Designed for calm, built for care.</h1><p className="mt-6 text-lg leading-8 text-ink-muted">Modern diagnostics, comfortable patient areas and 24/7 emergency readiness in one reassuring setting.</p></div><Image className="h-full min-h-72 rounded-3xl object-cover" src={SITE_IMAGES.hospital} alt="Modern hospital facility" width={900} height={650} /></div></main></PageShell>; }
