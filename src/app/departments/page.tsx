import Link from "next/link";
import { unstable_cache } from "next/cache";
import { PageShell } from "@/components/public/page-shell";
import { DEPARTMENTS } from "@/lib/site-content";
import { connectToDatabase } from "@/lib/mongodb";
import { Department } from "@/models/Department";

export const dynamic = "force-dynamic";
export const metadata = { title: "Hospital departments", description: "Explore our specialist hospital departments, services and coordinated patient care." };
type PublicDepartment = { name: string; description?: string; services?: string[] };

const getPublishedDepartments = unstable_cache(
  async (): Promise<PublicDepartment[]> => {
    try {
      await connectToDatabase();
      return await Department.find({ active: true, published: true }).select("name description services").sort({ name: 1 }).lean() as PublicDepartment[];
    } catch {
      return [];
    }
  },
  ["published-departments"],
  { revalidate: 300, tags: ["public-departments"] },
);

export default async function Departments() {
  const departments = await getPublishedDepartments();
  const visible: PublicDepartment[] = departments.length ? departments : DEPARTMENTS.map((name) => ({ name }));
  return <PageShell><main className="bg-canvas"><section className="mx-auto max-w-7xl px-5 py-20"><p className="font-semibold uppercase tracking-widest text-brand">Departments</p><h1 className="mt-3 text-5xl font-semibold">Care built around your needs.</h1><div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{visible.map((department) => <Link className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md" href={`/departments/${department.name.toLowerCase().replaceAll(" ", "-")}`} key={department.name}><h2 className="font-semibold">{department.name}</h2><p className="mt-2 text-sm text-ink-muted">{department.description || department.services?.slice(0, 2).join(" · ") || "Specialist-led care and modern facilities."}</p></Link>)}</div></section></main></PageShell>;
}
