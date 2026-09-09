"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { changePassword, type SettingsFormState } from "@/server/actions/auth";

const emptyState: SettingsFormState = {};

export function PasswordForm() {
  const [state, formAction, isPending] = useActionState(changePassword, emptyState);
  const formRef = useRef<HTMLFormElement>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const canSubmit = newPassword.length >= 8 && confirmPassword.length >= 8 && !passwordsMismatch;

  useEffect(() => {
    if (state.success) {
      toast.success("Senha alterada com sucesso");
      formRef.current?.reset();
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div className="space-y-1.5">
        <Label>Senha atual</Label>
        <PasswordInput name="currentPassword" required autoComplete="current-password" />
      </div>
      <div className="space-y-1.5">
        <Label>Nova senha</Label>
        <PasswordInput
          name="newPassword"
          required
          minLength={8}
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Confirmar nova senha</Label>
        <PasswordInput
          name="confirmPassword"
          required
          minLength={8}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          aria-invalid={passwordsMismatch}
        />
        {passwordsMismatch && <p className="text-xs text-destructive">As senhas não coincidem</p>}
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={isPending || !canSubmit}>{isPending ? "Alterando..." : "Alterar senha"}</Button>
    </form>
  );
}
