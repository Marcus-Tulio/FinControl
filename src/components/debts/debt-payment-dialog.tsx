"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addDebtPayment, type DebtFormState } from "@/server/actions/debts";

const emptyState: DebtFormState = {};

export function DebtPaymentDialog({ debtId, debtName, suggestedAmount }: { debtId: string; debtName: string; suggestedAmount?: number }) {
  const action = addDebtPayment.bind(null, debtId);
  const [state, formAction, isPending] = useActionState(action, emptyState);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (state.success) {
      toast.success("Pagamento registrado");
      setOpen(false);
    }
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="secondary"><Banknote className="h-3.5 w-3.5" /> Registrar pagamento</Button>} />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Pagamento de &quot;{debtName}&quot;</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Valor</Label>
            <Input name="amount" type="number" step="0.01" min="0.01" required defaultValue={suggestedAmount} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Data</Label>
            <Input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Observação (opcional)</Label>
            <Input name="note" />
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Salvando..." : "Registrar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
