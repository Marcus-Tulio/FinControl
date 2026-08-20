"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { upsertBudget, type BudgetFormState } from "@/server/actions/budgets";

type Category = { id: string; name: string };
const emptyState: BudgetFormState = {};

export function BudgetFormDialog({
  categories,
  month,
  year,
  existing,
}: {
  categories: Category[];
  month: number;
  year: number;
  existing?: { categoryId: string; limitAmount: number };
}) {
  const [state, formAction, isPending] = useActionState(upsertBudget, emptyState);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (state.success) {
      toast.success("Orçamento salvo");
      setOpen(false);
    }
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          existing ? (
            <Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button>
          ) : (
            <Button size="sm"><Plus className="h-4 w-4" /> Definir orçamento</Button>
          )
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{existing ? "Editar orçamento" : "Novo orçamento"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="month" value={month} />
          <input type="hidden" name="year" value={year} />

          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Select items={Object.fromEntries(categories.map((c) => [c.id, c.name]))} name="categoryId" defaultValue={existing?.categoryId} disabled={Boolean(existing)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Limite mensal</Label>
            <Input name="limitAmount" type="number" step="0.01" min="0.01" required defaultValue={existing?.limitAmount} />
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
