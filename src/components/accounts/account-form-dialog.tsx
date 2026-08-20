"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createAccount, updateAccount, type AccountFormState } from "@/server/actions/accounts";
import { ACCOUNT_TYPE_LABELS } from "@/lib/constants";
import type { FinancialAccountType } from "@prisma/client";

type Account = {
  id: string;
  name: string;
  type: FinancialAccountType;
  institution: string | null;
  color: string;
  icon: string;
  initialBalance: unknown;
};

const emptyState: AccountFormState = {};
const COLOR_OPTIONS = ["#2e9484", "#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#4a3aa7", "#64748b"];

export function AccountFormDialog({ account }: { account?: Account }) {
  const isEdit = Boolean(account);
  const action = isEdit ? updateAccount.bind(null, account!.id) : createAccount;
  const [state, formAction, isPending] = useActionState(action, emptyState);
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState(account?.color ?? "#2e9484");

  useEffect(() => {
    if (state.success) {
      toast.success(isEdit ? "Conta atualizada" : "Conta criada");
      setOpen(false);
    }
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          isEdit ? (
            <Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button>
          ) : (
            <Button><Plus className="h-4 w-4" /> Nova conta</Button>
          )
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar conta" : "Nova conta"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="color" value={color} />
          <input type="hidden" name="icon" value="wallet" />

          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input name="name" required defaultValue={account?.name} placeholder="Conta corrente, Nubank..." />
          </div>

          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select items={ACCOUNT_TYPE_LABELS} name="type" defaultValue={account?.type ?? "CHECKING"}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(ACCOUNT_TYPE_LABELS) as FinancialAccountType[]).map((t) => (
                  <SelectItem key={t} value={t}>{ACCOUNT_TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Instituição (opcional)</Label>
            <Input name="institution" defaultValue={account?.institution ?? undefined} placeholder="Banco, corretora..." />
          </div>

          <div className="space-y-1.5">
            <Label>{isEdit ? "Saldo inicial" : "Saldo inicial"}</Label>
            <Input name="initialBalance" type="number" step="0.01" defaultValue={account ? Number(account.initialBalance) : 0} />
          </div>

          <div className="space-y-1.5">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className="h-7 w-7 rounded-full"
                  style={{ backgroundColor: c, outline: color === c ? `2px solid ${c}` : "none", outlineOffset: 2 }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
