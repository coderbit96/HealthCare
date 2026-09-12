import LoginPage from "@/app/portal/login/page";
import { privateMetadata } from "@/lib/seo";

export const metadata = { title: "Admin login | Health Care .Pvt .Ltd", ...privateMetadata };

export default function AdminLoginPage() {
  return <LoginPage adminOnly />;
}
