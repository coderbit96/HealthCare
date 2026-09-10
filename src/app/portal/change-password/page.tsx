import { redirect } from "next/navigation";
import { AdminPasswordPage } from "@/components/portal/admin-password-page";
import { getServerSessionUser } from "@/lib/server-auth";

export const metadata = { title: "Change password | Health Care .Pvt .Ltd" };

export default async function ChangePasswordPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/portal/dashboard");
  return <AdminPasswordPage />;
}
