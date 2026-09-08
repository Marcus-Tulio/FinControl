import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const appleEnabled = Boolean(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET);
  const microsoftEnabled = Boolean(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET);

  return (
    <Suspense>
      <LoginForm googleEnabled={googleEnabled} appleEnabled={appleEnabled} microsoftEnabled={microsoftEnabled} />
    </Suspense>
  );
}
