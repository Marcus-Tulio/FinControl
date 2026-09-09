"use client";

import { useActionState, useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetAccountData, deleteUserAccount, type DangerZoneState } from "@/server/actions/danger-zone";

const emptyState: DangerZoneState = {};

function ConfirmDangerDialog({
  triggerLabel,
  title,
  description,
  confirmWord,
  action,
  hasPassword,
  successMessage,
  submitLabel,
  onSuccess,
}: {
  triggerLabel: string;
  title: string;
  description: string;
  confirmWord: string;
  action: (prev: DangerZoneState, formData: FormData) => Promise<DangerZoneState>;
  hasPassword: boolean;
  successMessage: string;
  submitLabel: string;
  onSuccess?: () => void;
}) {
  const [state, formAction, isPending] = useActionState(action, emptyState);
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    if (state.success) {
      toast.success(successMessage);
      setOpen(false);
      onSuccess?.();
    }
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive">{triggerLabel}</Button>} />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          <p className="text-sm text-muted-foreground">{description}</p>

          {hasPassword && (
            <div className="space-y-1.5">
              <Label>Senha atual</Label>
              <Input name="currentPassword" type="password" required />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>
              Digite <span className="font-semibold text-foreground">{confirmWord}</span> para confirmar
            </Label>
            <Input name="confirmText" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} required />
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <Button type="submit" variant="destructive" className="w-full" disabled={isPending || confirmText !== confirmWord}>
            {isPending ? "Processando..." : submitLabel}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DangerZoneSection({ hasPassword }: { hasPassword: boolean }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">Reiniciar dados</p>
          <p className="text-xs text-muted-foreground">
            Apaga todas as transações, contas, categorias, orçamentos, metas, dívidas e investimentos. Sua conta continua ativa, com os dados zerados.
          </p>
        </div>
        <ConfirmDangerDialog
          triggerLabel="Reiniciar dados"
          title="Reiniciar todos os dados"
          description="Isso vai apagar permanentemente todas as suas transações, contas, categorias, orçamentos, metas, dívidas e investimentos. Sua conta de login continua ativa, com os dados zerados (categorias e contas padrão serão recriadas). Essa ação não pode ser desfeita."
          confirmWord="REINICIAR"
          action={resetAccountData}
          hasPassword={hasPassword}
          successMessage="Dados reiniciados"
          submitLabel="Reiniciar dados"
        />
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">Excluir conta</p>
          <p className="text-xs text-muted-foreground">Remove sua conta e todos os seus dados permanentemente. Não pode ser desfeito.</p>
        </div>
        <ConfirmDangerDialog
          triggerLabel="Excluir conta"
          title="Excluir conta permanentemente"
          description="Isso vai apagar sua conta e todos os seus dados (transações, contas, categorias, orçamentos, metas, dívidas, investimentos) permanentemente. Essa ação não pode ser desfeita."
          confirmWord="EXCLUIR"
          action={deleteUserAccount}
          hasPassword={hasPassword}
          successMessage="Conta excluída"
          submitLabel="Excluir minha conta"
          onSuccess={() => signOut({ callbackUrl: "/login" })}
        />
      </div>
    </div>
  );
}
