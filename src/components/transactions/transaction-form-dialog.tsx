"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTransaction, updateTransaction, type TransactionFormState } from "@/server/actions/transactions";
import type { TransactionKind } from "@prisma/client";

type Account = { id: string; name: string };
type Category = { id: string; name: string; kind: TransactionKind };

type ExistingTransaction = {
  id: string;
  kind: TransactionKind;
  financialAccountId: string;
  categoryId: string | null;
  description: string;
  notes: string | null;
  amount: number;
  date: Date;
  status: string;
  isEssential: boolean;
};

const KIND_LABELS: Record<"INCOME" | "EXPENSE" | "INVESTMENT" | "ADJUSTMENT", string> = {
  INCOME: "Receita",
  EXPENSE: "Despesa",
  INVESTMENT: "Investimento",
  ADJUSTMENT: "Ajuste de saldo",
};

const FREQUENCY_LABELS = { DAILY: "Diária", WEEKLY: "Semanal", MONTHLY: "Mensal", YEARLY: "Anual" };

const emptyState: TransactionFormState = {};

function toDateInput(d: Date) {
  return new Date(d).toISOString().slice(0, 10);
}

export function TransactionFormDialog({
  accounts,
  categories,
  transaction,
  triggerLabel,
  open: openProp,
  onOpenChange,
  defaultKind = "EXPENSE",
}: {
  accounts: Account[];
  categories: Category[];
  transaction?: ExistingTransaction;
  triggerLabel?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultKind?: TransactionKind;
}) {
  const isEdit = Boolean(transaction);
  const action = isEdit ? updateTransaction.bind(null, transaction!.id) : createTransaction;
  const [state, formAction, isPending] = useActionState(action, emptyState);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setUncontrolledOpen;
  const [kind, setKind] = useState<TransactionKind>(transaction?.kind ?? defaultKind);
  const [isRecurring, setIsRecurring] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success(isEdit ? "Transação atualizada" : "Transação criada");
      setOpen(false);
      formRef.current?.reset();
    }
  }, [state.success]);

  const filteredCategories = categories.filter((c) => c.kind === kind);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger
          render={
            <Button>
              <Plus className="h-4 w-4" />
              {triggerLabel ?? "Nova transação"}
            </Button>
          }
        />
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar transação" : "Nova transação"}</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select items={KIND_LABELS} value={kind} onValueChange={(v) => setKind(v as TransactionKind)} disabled={isEdit && transaction?.kind === "ADJUSTMENT"}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(KIND_LABELS) as (keyof typeof KIND_LABELS)[]).map((k) => (
                  <SelectItem key={k} value={k}>{KIND_LABELS[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="kind" value={kind} />
          </div>

          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Input name="description" required defaultValue={transaction?.description} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Valor</Label>
              <Input name="amount" type="number" step="0.01" min="0.01" required defaultValue={transaction?.amount} />
            </div>
            <div className="space-y-1.5">
              <Label>Data</Label>
              <Input name="date" type="date" required defaultValue={transaction ? toDateInput(transaction.date) : new Date().toISOString().slice(0, 10)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Conta</Label>
              <Select items={Object.fromEntries(accounts.map((a) => [a.id, a.name]))} name="financialAccountId" required defaultValue={transaction?.financialAccountId}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select items={Object.fromEntries(filteredCategories.map((c) => [c.id, c.name]))} name="categoryId" defaultValue={transaction?.categoryId ?? undefined}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <Label htmlFor="isPaid" className="text-sm font-normal">
              {kind === "INCOME" ? "Já recebido" : "Já pago"}
            </Label>
            <Switch id="isPaid" name="isPaid" defaultChecked={transaction ? transaction.status === "PAID" : true} value="true" />
          </div>

          {kind === "EXPENSE" && (
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <Label htmlFor="essential" className="text-sm font-normal">Despesa essencial</Label>
              <Switch id="essential" name="isEssential" defaultChecked={transaction?.isEssential ?? true} value="true" />
            </div>
          )}

          {!isEdit && (
            <>
              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                <Label htmlFor="recurring" className="text-sm font-normal">Repetir automaticamente</Label>
                <Switch id="recurring" name="isRecurring" checked={isRecurring} onCheckedChange={setIsRecurring} value="true" />
              </div>
              {isRecurring && (
                <Select items={FREQUENCY_LABELS} name="frequency" defaultValue="MONTHLY">
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">Diária</SelectItem>
                    <SelectItem value="WEEKLY">Semanal</SelectItem>
                    <SelectItem value="MONTHLY">Mensal</SelectItem>
                    <SelectItem value="YEARLY">Anual</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {kind === "EXPENSE" && !isRecurring && (
                <div className="space-y-1.5">
                  <Label>Parcelas</Label>
                  <Input name="installments" type="number" min="1" max="360" defaultValue="1" />
                </div>
              )}
            </>
          )}

          <div className="space-y-1.5">
            <Label>Observações (opcional)</Label>
            <Input name="notes" defaultValue={transaction?.notes ?? undefined} />
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
