import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/public/page-shell";
import { publicMetadata } from "@/lib/seo";
const humanize = (slug: string) => slug.split("-").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" ");
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const name = humanize(slug); return publicMetadata({ title: `Dr. ${name}`, description: `Book an appointment with Dr. ${name}, a specialist at Health Care Pvt. Ltd. in Kolkata.`, path: `/doctors/${slug}` }); }
export default async function DoctorDetail({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const name = humanize(slug); return <PageShell><main className="mx-auto max-w-4xl px-5 py-20"><p className="font-semibold uppercase tracking-widest text-brand">Our specialist</p><h1 className="mt-3 text-5xl font-semibold">Dr. {name}</h1><p className="mt-6 text-lg leading-8 text-ink-muted">A trusted specialist focused on thoughtful consultations, clear communication and evidence-led care.</p><Link href="/appointments" className="mt-8 inline-block rounded-full bg-brand px-6 py-3 font-semibold text-white">Book with this doctor</Link></main></PageShell>; }
