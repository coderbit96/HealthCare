import Image from "next/image";
import { PageShell } from "@/components/public/page-shell";
import { Reveal } from "@/components/public/reveal";
import { publicMetadata } from "@/lib/seo";

export const metadata = publicMetadata({ title: "Find specialist doctors in Kolkata", description: "Meet experienced Health Care Pvt. Ltd. specialists in Kolkata and find the right doctor for your needs.", path: "/doctors" });

const doctors = [
  { initials: "AS", name: "Dr. Ananya Sen", department: "Cardiology", specialty: "Consultant Cardiologist", focus: "Preventive cardiology and heart rhythm care", image: "/images/doctors/dr-ananya-sen.png" },
  { initials: "RK", name: "Dr. Rohan Kapoor", department: "Neurology", specialty: "Consultant Neurologist", focus: "Stroke care and movement disorders", image: "/images/doctors/dr-rohan-kapoor.png" },
  { initials: "PM", name: "Dr. Priya Mehta", department: "Paediatrics", specialty: "Consultant Paediatrician", focus: "Child development and family care", image: "/images/doctors/dr-priya-mehta.png" },
  { initials: "AD", name: "Dr. Arjun Das", department: "Orthopaedics", specialty: "Orthopaedic Surgeon", focus: "Sports medicine and joint replacement", image: "/images/doctors/dr-arjun-das.png" },
  { initials: "SQ", name: "Dr. Sana Qureshi", department: "Women’s Health", specialty: "Consultant Obstetrician & Gynaecologist", focus: "Women’s wellness and maternity care", image: "/images/doctors/dr-sana-qureshi.png" },
  { initials: "VN", name: "Dr. Vivek Nair", department: "General Medicine", specialty: "Consultant Physician", focus: "Everyday health and chronic care management", image: "/images/doctors/dr-vivek-nair.png" },
];

export default function Doctors() {
  return (
    <PageShell>
      <main>
        <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-[.2em] text-brand">Our specialists</p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">Meet the people behind your care.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-ink-muted">Experienced specialists who take time to understand you, not just your symptoms.</p>
          </Reveal>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((doctor, index) => (
              <Reveal key={doctor.name} delay={index * 0.07}>
                <article className="group h-full overflow-hidden rounded-panel border border-line bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-ink/10">
                  <div className="relative aspect-[4/3] overflow-hidden bg-surface-sunken">
                    <Image src={doctor.image} alt={`${doctor.name}, ${doctor.specialty}`} fill className="object-cover object-top transition duration-500 group-hover:scale-[1.04]" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-transparent" />
                    <span className="absolute bottom-4 left-4 rounded-full border border-white/40 bg-white/90 px-3 py-1 text-xs font-bold tracking-wide text-brand-strong shadow-sm">{doctor.department}</span>
                    <span className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-brand-strong/85 text-sm font-bold text-white shadow-lg backdrop-blur">{doctor.initials}</span>
                  </div>
                  <div className="p-6">
                    <p className="text-sm font-bold text-brand">{doctor.specialty}</p>
                    <h2 className="mt-2 font-display text-2xl font-semibold text-ink">{doctor.name}</h2>
                    <p className="mt-3 text-sm leading-6 text-ink-muted">{doctor.focus}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
      </main>
    </PageShell>
  );
}
