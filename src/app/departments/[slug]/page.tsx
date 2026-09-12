import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/public/page-shell";
import { publicMetadata } from "@/lib/seo";
const humanize = (slug: string) => slug.split("-").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" ");
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const name = humanize(slug); return publicMetadata({ title: `${name} department in Kolkata`, description: `Learn about ${name} services, specialists and appointments at Health Care Pvt. Ltd. in Kolkata.`, path: `/departments/${slug}` }); }
export default async function DepartmentDetail({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const name = humanize(slug); return <PageShell><main className="mx-auto max-w-4xl px-5 py-20"><p className="font-semibold uppercase tracking-widest text-brand">Department</p><h1 className="mt-3 text-5xl font-semibold">{name}</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-ink-muted">Compassionate specialist care, clear next steps and coordinated support at every stage.</p><Link className="mt-8 inline-block rounded-full bg-brand px-6 py-3 font-semibold text-white" href="/appointments">Book an appointment</Link></main></PageShell>; }
