"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword, type SettingsFormState } from "@/server/actions/auth";

const emptyState: SettingsFormState = {};

export function PasswordForm() {
  const [state, formAction, isPending] = useActionState(changePassword, emptyState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success("Senha alterada com sucesso");
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div className="space-y-1.5">
        <Label>Senha atual</Label>
        <Input name="currentPassword" type="password" required autoComplete="current-password" />
      </div>
      <div className="space-y-1.5">
        <Label>Nova senha</Label>
        <Input name="newPassword" type="password" required minLength={8} autoComplete="new-password" />
      </div>
      <div className="space-y-1.5">
        <Label>Confirmar nova senha</Label>
        <Input name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={isPending}>{isPending ? "Alterando..." : "Alterar senha"}</Button>
    </form>
  );
}
