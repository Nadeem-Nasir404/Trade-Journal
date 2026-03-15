import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { LoginScreen } from "@/components/login-screen";
import { authOptions } from "@/lib/auth";

export default async function SignUpPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return <LoginScreen mode="signup" />;
}
