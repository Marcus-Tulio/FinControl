"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile, type SettingsFormState } from "@/server/actions/auth";

const emptyState: SettingsFormState = {};

export function ProfileForm({ name, email }: { name: string | null; email: string | null }) {
  const [state, formAction, isPending] = useActionState(updateProfile, emptyState);

  useEffect(() => {
    if (state.success) toast.success("Perfil atualizado");
  }, [state.success]);

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-1.5">
        <Label>Nome</Label>
        <Input name="name" defaultValue={name ?? ""} required />
      </div>
      <div className="space-y-1.5">
        <Label>E-mail</Label>
        <Input value={email ?? ""} disabled />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={isPending}>{isPending ? "Salvando..." : "Salvar alterações"}</Button>
    </form>
  );
}
