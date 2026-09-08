import { Suspense } from "react";
import { getCurrentUser } from "@/server/session";
import { UnlockForm } from "@/components/auth/unlock-form";

export default async function DesbloquearPage() {
  const user = await getCurrentUser();

  return (
    <Suspense>
      <UnlockForm name={user?.name} />
    </Suspense>
  );
}
