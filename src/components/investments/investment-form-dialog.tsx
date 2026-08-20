"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createInvestment, updateInvestment, type InvestmentFormState } from "@/server/actions/investments";
import { INVESTMENT_TYPE_LABELS } from "@/lib/constants";
import type { InvestmentType } from "@prisma/client";

type Investment = {
  id: string; name: string; type: InvestmentType; broker: string | null; ticker: string | null;
  quantity: unknown; avgPrice: unknown; currentPrice: unknown; notes: string | null;
};
const emptyState: InvestmentFormState = {};

export function InvestmentFormDialog({ investment }: { investment?: Investment }) {
  const isEdit = Boolean(investment);
  const action = isEdit ? updateInvestment.bind(null, investment!.id) : createInvestment;
  const [state, formAction, isPending] = useActionState(action, emptyState);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (state.success) {
      toast.success(isEdit ? "Investimento atualizado" : "Investimento cadastrado");
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
            <Button><Plus className="h-4 w-4" /> Novo investimento</Button>
          )
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar investimento" : "Novo investimento"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input name="name" required defaultValue={investment?.name} placeholder="Tesouro Selic, PETR4..." />
          </div>

          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select items={INVESTMENT_TYPE_LABELS} name="type" defaultValue={investment?.type ?? "FIXED_INCOME"}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(INVESTMENT_TYPE_LABELS) as InvestmentType[]).map((t) => (
                  <SelectItem key={t} value={t}>{INVESTMENT_TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Corretora (opcional)</Label>
              <Input name="broker" defaultValue={investment?.broker ?? undefined} />
            </div>
            <div className="space-y-1.5">
              <Label>Ticker (opcional)</Label>
              <Input name="ticker" defaultValue={investment?.ticker ?? undefined} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Quantidade</Label>
              <Input name="quantity" type="number" step="0.000001" defaultValue={investment ? Number(investment.quantity) : 0} />
            </div>
            <div className="space-y-1.5">
              <Label>Preço médio</Label>
              <Input name="avgPrice" type="number" step="0.0001" defaultValue={investment ? Number(investment.avgPrice) : 0} />
            </div>
            <div className="space-y-1.5">
              <Label>Preço atual</Label>
              <Input name="currentPrice" type="number" step="0.0001" defaultValue={investment ? Number(investment.currentPrice) : 0} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notas (opcional)</Label>
            <Input name="notes" defaultValue={investment?.notes ?? undefined} />
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
