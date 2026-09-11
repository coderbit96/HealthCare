import { ArrowRight, BookOpen, Clock3, HeartPulse, Stethoscope } from "lucide-react";
import Link from "next/link";
import { PageShell } from "@/components/public/page-shell";
import { Reveal } from "@/components/public/reveal";

export const metadata = { title: "Health blog", description: "Helpful, evidence-informed health articles from the Health Care Pvt. Ltd. clinical team." };

const posts = [
  { slug: "heart-health-everyday", title: "Small habits for a healthier heart", excerpt: "Practical daily choices that can support your long-term heart health.", category: "Heart health", readTime: "4 min read", icon: HeartPulse },
  { slug: "when-to-see-a-doctor", title: "When a symptom deserves attention", excerpt: "A calm guide to recognising when it is time to speak with a healthcare professional.", category: "Everyday health", readTime: "5 min read", icon: Stethoscope },
  { slug: "family-health-checks", title: "Planning your family health checks", excerpt: "How to make preventive care a simple, manageable part of family life.", category: "Preventive care", readTime: "4 min read", icon: BookOpen },
];

export default function Blogs() {
  return <PageShell><main className="bg-canvas"><section className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24"><Reveal><p className="text-sm font-bold uppercase tracking-[.2em] text-brand">Health articles</p><h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">Clearer health information, for everyday decisions.</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-ink-muted">Practical, clinician-informed reading to help you ask better questions and feel more prepared.</p></Reveal><div className="mt-12 grid gap-6 lg:grid-cols-3">{posts.map((post, index) => <Reveal key={post.slug} delay={index * .07}><article className="group flex h-full flex-col rounded-[1.5rem] border border-line bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand/25 hover:shadow-xl hover:shadow-brand/10"><span className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand"><post.icon size={24} /></span><p className="mt-6 text-sm font-bold text-brand">{post.category}</p><h2 className="mt-2 font-display text-2xl font-semibold leading-tight text-ink">{post.title}</h2><p className="mt-4 flex-1 leading-7 text-ink-muted">{post.excerpt}</p><div className="mt-7 flex items-center justify-between border-t border-line pt-5 text-sm text-ink-subtle"><span className="inline-flex items-center gap-1.5"><Clock3 size={16} />{post.readTime}</span><Link href={`/blogs/${post.slug}`} className="inline-flex items-center gap-1.5 font-bold text-brand transition group-hover:gap-2.5">Read article <ArrowRight size={16} /></Link></div></article></Reveal>)}</div><Reveal><p className="mt-10 rounded-2xl border border-accent/15 bg-accent-soft px-5 py-4 text-sm leading-6 text-ink-muted"><strong className="text-ink">A friendly reminder:</strong> our articles support general health education and never replace personalised medical advice.</p></Reveal></section></main></PageShell>;
}
