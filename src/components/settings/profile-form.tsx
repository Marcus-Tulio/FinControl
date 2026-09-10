"use client";

import { useActionState, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile, type SettingsFormState } from "@/server/actions/auth";

const emptyState: SettingsFormState = {};

export function ProfileForm({
  name,
  email,
  isBusiness = false,
}: {
  name: string | null;
  email: string | null;
  isBusiness?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(updateProfile, emptyState);
  // Controlado propositalmente: o React 19 reseta campos nao controlados para o defaultValue
  // original apos a action terminar (mesmo com sucesso), o que faria o nome parecer que voltou
  // ao valor antigo mesmo tendo salvo corretamente.
  const [name_, setName] = useState(name ?? "");
  const { update } = useSession();

  useEffect(() => {
    if (state.success) {
      toast.success("Perfil atualizado");
      // update() sem argumentos só refaz um GET; precisa de um payload para disparar trigger "update" no callback JWT.
      update({});
    }
  }, [state.success]);

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-1.5">
        <Label>{isBusiness ? "Razão Social" : "Nome"}</Label>
        <Input name="name" value={name_} onChange={(e) => setName(e.target.value)} required />
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
