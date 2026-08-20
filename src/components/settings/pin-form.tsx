"use client";

import { useActionState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePin, removePin, type SettingsFormState } from "@/server/actions/auth";

const emptyState: SettingsFormState = {};

export function PinForm({ hasPin }: { hasPin: boolean }) {
  const [state, formAction, isPending] = useActionState(updatePin, emptyState);
  const [isRemoving, startRemoveTransition] = useTransition();

  useEffect(() => {
    if (state.success) toast.success("PIN atualizado");
  }, [state.success]);

  function handleRemove() {
    startRemoveTransition(async () => {
      await removePin();
      toast.success("PIN removido");
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {hasPin ? "Você já possui um PIN configurado como camada extra de segurança." : "Defina um PIN numérico como camada extra de segurança ao abrir o app."}
      </p>
      <form action={formAction} className="flex items-end gap-2">
        <div className="space-y-1.5">
          <Label>{hasPin ? "Novo PIN" : "PIN"}</Label>
          <Input name="pin" type="password" inputMode="numeric" pattern="\d{4,6}" maxLength={6} placeholder="****" className="w-32" />
        </div>
        <Button type="submit" disabled={isPending}>{isPending ? "Salvando..." : hasPin ? "Atualizar PIN" : "Definir PIN"}</Button>
        {hasPin && (
          <Button type="button" variant="outline" onClick={handleRemove} disabled={isRemoving}>Remover PIN</Button>
        )}
      </form>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </div>
  );
}
