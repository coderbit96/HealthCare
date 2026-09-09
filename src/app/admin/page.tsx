import LoginPage from "@/app/portal/login/page";

export const metadata = { title: "Admin login | Health Care .Pvt .Ltd" };

export default function AdminLoginPage() {
  return <LoginPage adminOnly />;
}
