"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addInvestmentMovement, type InvestmentFormState } from "@/server/actions/investments";

const emptyState: InvestmentFormState = {};
const TYPE_LABELS = { CONTRIBUTION: "Aporte", WITHDRAWAL: "Resgate", DIVIDEND: "Dividendo/Rendimento", PRICE_UPDATE: "Atualizar preço atual" };

export function InvestmentMovementDialog({ investmentId, name }: { investmentId: string; name: string }) {
  const action = addInvestmentMovement.bind(null, investmentId);
  const [state, formAction, isPending] = useActionState(action, emptyState);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("CONTRIBUTION");

  useEffect(() => {
    if (state.success) {
      toast.success("Movimentação registrada");
      setOpen(false);
    }
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="secondary"><TrendingUp className="h-3.5 w-3.5" /> Movimentar</Button>} />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Movimentação em &quot;{name}&quot;</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select items={TYPE_LABELS} name="type" value={type} onValueChange={(v) => v && setType(v)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {type !== "PRICE_UPDATE" && (
            <div className="space-y-1.5">
              <Label>Valor</Label>
              <Input name="amount" type="number" step="0.01" min="0" required />
            </div>
          )}

          {(type === "CONTRIBUTION" || type === "WITHDRAWAL") && (
            <div className="space-y-1.5">
              <Label>Quantidade (opcional)</Label>
              <Input name="quantity" type="number" step="0.000001" min="0" />
            </div>
          )}

          {type !== "DIVIDEND" && (
            <div className="space-y-1.5">
              <Label>{type === "PRICE_UPDATE" ? "Novo preço" : "Preço unitário (opcional)"}</Label>
              <Input name="price" type="number" step="0.0001" min="0" required={type === "PRICE_UPDATE"} />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Data</Label>
            <Input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
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
