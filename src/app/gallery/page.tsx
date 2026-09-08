import Image from "next/image";
import { PageShell } from "@/components/public/page-shell";
import { SITE_IMAGES } from "@/lib/site-content";
export default function Gallery() { return <PageShell><main className="mx-auto max-w-6xl px-5 py-20"><p className="font-semibold uppercase tracking-widest text-brand">Gallery</p><h1 className="mt-3 text-5xl font-semibold">Our care environment.</h1><div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Object.values(SITE_IMAGES).map((image, i) => <Image className="aspect-square rounded-2xl object-cover" key={image} src={image} alt={`Health Care hospital gallery image ${i + 1}`} width={700} height={700} />)}</div></main></PageShell>; }
