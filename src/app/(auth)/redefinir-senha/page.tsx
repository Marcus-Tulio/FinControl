import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;

  return (
    <Suspense>
      <ResetPasswordForm email={email ?? ""} token={token ?? ""} />
    </Suspense>
  );
}
