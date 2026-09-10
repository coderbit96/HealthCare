import { redirect } from "next/navigation";
import { AdminProfilePage } from "@/components/portal/admin-profile-page";
import { getServerSessionUser } from "@/lib/server-auth";

export const metadata = { title: "My profile | Health Care .Pvt .Ltd" };

export default async function ProfilePage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/portal/dashboard");
  return <AdminProfilePage user={user} />;
}
