import Link from "next/link";
import { PortalLogin } from "@/components/portal/portal-login";
import { Brand } from "@/components/public/brand";
export const metadata = { title: "Staff portal | Health Care .Pvt .Ltd" };
export default function Login() { return <main className="grid min-h-screen place-items-center bg-brand-strong px-5 py-10"><div className="absolute left-5 top-6"><Brand light /></div><div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_15%_10%,#0f766e_0,transparent_25%),radial-gradient(circle_at_90%_90%,#155e75_0,transparent_28%)]" /><div className="relative z-10 w-full max-w-md"><PortalLogin /><Link className="mt-6 block text-center text-sm font-semibold text-white/70 hover:text-white" href="/">← Back to hospital website</Link></div></main>; }
