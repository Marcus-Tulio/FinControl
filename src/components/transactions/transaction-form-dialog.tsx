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
import { CategoryPicker, type CategoryTree } from "@/components/shared/category-picker";
import { CurrencyInput } from "@/components/shared/currency-input";
import { createTransaction, updateTransaction, type TransactionFormState } from "@/server/actions/transactions";
import type { TransactionKind } from "@prisma/client";

type Account = { id: string; name: string };
type Category = CategoryTree & { kind: TransactionKind };

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
  expenseType?: "FIXED" | "VARIABLE" | "EXTRAORDINARY" | null;
};

const KIND_LABELS: Record<"INCOME" | "EXPENSE" | "INVESTMENT" | "ADJUSTMENT", string> = {
  INCOME: "Receita",
  EXPENSE: "Despesa",
  INVESTMENT: "Investimento",
  ADJUSTMENT: "Ajuste de saldo",
};

const FREQUENCY_LABELS = { DAILY: "Diária", WEEKLY: "Semanal", MONTHLY: "Mensal", YEARLY: "Anual" };
const EXPENSE_TYPE_LABELS = { FIXED: "Fixa", VARIABLE: "Variável", EXTRAORDINARY: "Extraordinária" };

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
  const [hasInstallments, setHasInstallments] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success(isEdit ? "Transação atualizada" : "Transação criada");
      setOpen(false);
      formRef.current?.reset();
      setHasInstallments(false);
      setResetKey((k) => k + 1);
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

          <CategoryPicker key={kind} categories={filteredCategories} defaultCategoryId={transaction?.categoryId} allowSubcategory={kind === "EXPENSE"} />

          <div className="space-y-1.5">
            <Label>Descrição (opcional)</Label>
            <Input name="description" defaultValue={transaction?.description} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Valor</Label>
              <CurrencyInput key={resetKey} name="amount" required defaultValue={transaction?.amount} />
            </div>
            <div className="space-y-1.5">
              <Label>Data</Label>
              <Input name="date" type="date" required defaultValue={transaction ? toDateInput(transaction.date) : new Date().toISOString().slice(0, 10)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Conta</Label>
            <Select items={Object.fromEntries(accounts.map((a) => [a.id, a.name]))} name="financialAccountId" required defaultValue={transaction?.financialAccountId}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={`flex items-center justify-between rounded-lg border px-3 py-2 ${kind !== "EXPENSE" ? "col-span-2" : ""}`}>
              <Label htmlFor="isPaid" className="text-sm font-normal">
                {kind === "INCOME" ? "Já recebido" : "Já pago"}
              </Label>
              <Switch id="isPaid" name="isPaid" defaultChecked={transaction ? transaction.status === "PAID" : true} value="true" uncheckedValue="false" />
            </div>
            {kind === "EXPENSE" && (
              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                <Label htmlFor="essential" className="text-sm font-normal">Despesa essencial</Label>
                <Switch id="essential" name="isEssential" defaultChecked={transaction?.isEssential ?? true} value="true" uncheckedValue="false" />
              </div>
            )}
          </div>

          {kind === "EXPENSE" && (
            <div className="space-y-1.5">
              <Label>Tipo de despesa (opcional)</Label>
              <Select items={EXPENSE_TYPE_LABELS} name="expenseType" defaultValue={transaction?.expenseType ?? undefined}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIXED">Fixa</SelectItem>
                  <SelectItem value="VARIABLE">Variável</SelectItem>
                  <SelectItem value="EXTRAORDINARY">Extraordinária</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {!isEdit && (
            <div className="grid grid-cols-2 gap-3">
              <div className={`space-y-2 ${!(kind === "EXPENSE" && !isRecurring) ? "col-span-2" : ""}`}>
                <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <Label htmlFor="recurring" className="text-sm font-normal">Repetir</Label>
                  <Switch id="recurring" name="isRecurring" checked={isRecurring} onCheckedChange={setIsRecurring} value="true" uncheckedValue="false" />
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
              </div>
              {kind === "EXPENSE" && !isRecurring && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <Label htmlFor="has-installments" className="text-sm font-normal">Compra parcelada</Label>
                    <Switch id="has-installments" checked={hasInstallments} onCheckedChange={setHasInstallments} />
                  </div>
                  {hasInstallments && (
                    <div className="space-y-1.5">
                      <Label>Parcelas</Label>
                      <Input name="installments" type="number" min="2" max="360" defaultValue="2" required />
                    </div>
                  )}
                </div>
              )}
            </div>
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
