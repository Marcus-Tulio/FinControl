"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createDebt, updateDebt, type DebtFormState } from "@/server/actions/debts";
import { DEBT_TYPE_LABELS } from "@/lib/constants";
import type { DebtType } from "@prisma/client";

type Debt = {
  id: string; name: string; type: DebtType; originalAmount: unknown; remainingAmount: unknown;
  interestRate: unknown; installmentsTotal: number | null; installmentsPaid: number;
  installmentAmount: unknown; dueDay: number | null; nextDueDate: Date | null;
};
const emptyState: DebtFormState = {};

function toDateInput(d: Date | null) {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

export function DebtFormDialog({ debt }: { debt?: Debt }) {
  const isEdit = Boolean(debt);
  const action = isEdit ? updateDebt.bind(null, debt!.id) : createDebt;
  const [state, formAction, isPending] = useActionState(action, emptyState);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (state.success) {
      toast.success(isEdit ? "Dívida atualizada" : "Dívida cadastrada");
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
            <Button><Plus className="h-4 w-4" /> Nova dívida</Button>
          )
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar dívida" : "Nova dívida"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input name="name" required defaultValue={debt?.name} placeholder="Financiamento do carro..." />
          </div>

          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select items={DEBT_TYPE_LABELS} name="type" defaultValue={debt?.type ?? "LOAN"}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(DEBT_TYPE_LABELS) as DebtType[]).map((t) => (
                  <SelectItem key={t} value={t}>{DEBT_TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Valor original</Label>
              <Input name="originalAmount" type="number" step="0.01" required defaultValue={debt ? Number(debt.originalAmount) : undefined} />
            </div>
            <div className="space-y-1.5">
              <Label>Valor restante</Label>
              <Input name="remainingAmount" type="number" step="0.01" required defaultValue={debt ? Number(debt.remainingAmount) : undefined} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Juros (% a.m.)</Label>
              <Input name="interestRate" type="number" step="0.01" defaultValue={debt ? Number(debt.interestRate) : 0} />
            </div>
            <div className="space-y-1.5">
              <Label>Valor da parcela</Label>
              <Input name="installmentAmount" type="number" step="0.01" defaultValue={debt ? Number(debt.installmentAmount ?? 0) : undefined} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Parcelas totais</Label>
              <Input name="installmentsTotal" type="number" min="0" defaultValue={debt?.installmentsTotal ?? undefined} />
            </div>
            <div className="space-y-1.5">
              <Label>Parcelas pagas</Label>
              <Input name="installmentsPaid" type="number" min="0" defaultValue={debt?.installmentsPaid ?? 0} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Próximo vencimento</Label>
            <Input name="nextDueDate" type="date" defaultValue={debt ? toDateInput(debt.nextDueDate) : undefined} />
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
