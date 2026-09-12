import LoginPage from "@/app/portal/login/page";
import { privateMetadata } from "@/lib/seo";

export const metadata = { title: "Sign in | Health Care .Pvt .Ltd", ...privateMetadata };

export default function Login() {
  return <LoginPage />;
}
