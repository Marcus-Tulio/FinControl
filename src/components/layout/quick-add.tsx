"use client";

import { createContext, useActionState, useContext, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CategoryPicker, type CategoryTree } from "@/components/shared/category-picker";
import { CurrencyInput } from "@/components/shared/currency-input";
import { createTransaction, type TransactionFormState } from "@/server/actions/transactions";
import { transferBetweenAccounts, type AccountFormState } from "@/server/actions/accounts";
import { toast } from "sonner";

type Account = { id: string; name: string };

const emptyTx: TransactionFormState = {};
const emptyTransfer: AccountFormState = {};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function IncomeExpenseForm({
  kind,
  accounts,
  categories,
  onDone,
}: {
  kind: "INCOME" | "EXPENSE" | "INVESTMENT";
  accounts: Account[];
  categories: CategoryTree[];
  onDone: () => void;
}) {
  const [state, formAction, isPending] = useActionState(createTransaction, emptyTx);
  const [isRecurring, setIsRecurring] = useState(false);
  const [hasInstallments, setHasInstallments] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  const successLabel = kind === "INCOME" ? "Receita adicionada" : kind === "EXPENSE" ? "Despesa adicionada" : "Investimento registrado";
  const descPlaceholder = kind === "INCOME" ? "Salário, freelance..." : kind === "EXPENSE" ? "Mercado, aluguel..." : "Aporte em CDB, ações...";

  useEffect(() => {
    if (state.success) {
      toast.success(successLabel);
      formRef.current?.reset();
      setHasInstallments(false);
      setResetKey((k) => k + 1);
      onDone();
    }
  }, [state.success]);

  const showInstallmentsPair = kind === "EXPENSE" && !isRecurring;

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="kind" value={kind} />
      <CategoryPicker categories={categories} allowSubcategory={kind === "EXPENSE"} />
      <div className="space-y-1.5">
        <Label>Descrição (opcional)</Label>
        <Input name="description" placeholder={descPlaceholder} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Valor</Label>
          <CurrencyInput key={resetKey} name="amount" required />
        </div>
        <div className="space-y-1.5">
          <Label>Data</Label>
          <Input name="date" type="date" defaultValue={todayStr()} required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Conta</Label>
        <Select items={Object.fromEntries(accounts.map((a) => [a.id, a.name]))} name="financialAccountId" required>
          <SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={`flex items-center justify-between rounded-lg border px-3 py-2 ${kind !== "EXPENSE" ? "col-span-2" : ""}`}>
          <Label htmlFor={`paid-${kind}`} className="text-sm font-normal">
            {kind === "INCOME" ? "Já recebido" : kind === "INVESTMENT" ? "Já aportado" : "Já pago"}
          </Label>
          <Switch id={`paid-${kind}`} name="isPaid" defaultChecked value="true" uncheckedValue="false" />
        </div>
        {kind === "EXPENSE" && (
          <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <Label htmlFor="essential" className="text-sm font-normal">Despesa essencial</Label>
            <Switch id="essential" name="isEssential" defaultChecked value="true" uncheckedValue="false" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={`space-y-2 ${!showInstallmentsPair ? "col-span-2" : ""}`}>
          <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <Label htmlFor={`recurring-${kind}`} className="text-sm font-normal">Repetir</Label>
            <Switch id={`recurring-${kind}`} name="isRecurring" checked={isRecurring} onCheckedChange={setIsRecurring} value="true" uncheckedValue="false" />
          </div>
          {isRecurring && (
            <Select items={{ DAILY: "Diária", WEEKLY: "Semanal", MONTHLY: "Mensal", YEARLY: "Anual" }} name="frequency" defaultValue="MONTHLY">
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
        {showInstallmentsPair && (
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <Label htmlFor={`has-installments-${kind}`} className="text-sm font-normal">Compra parcelada</Label>
              <Switch id={`has-installments-${kind}`} checked={hasInstallments} onCheckedChange={setHasInstallments} />
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

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}

function TransferForm({ accounts, onDone }: { accounts: Account[]; onDone: () => void }) {
  const [state, formAction, isPending] = useActionState(transferBetweenAccounts, emptyTransfer);
  const [resetKey, setResetKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success("Transferência realizada");
      formRef.current?.reset();
      setResetKey((k) => k + 1);
      onDone();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>De</Label>
          <Select items={Object.fromEntries(accounts.map((a) => [a.id, a.name]))} name="fromAccountId" required>
            <SelectTrigger className="w-full"><SelectValue placeholder="Origem" /></SelectTrigger>
            <SelectContent>
              {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Para</Label>
          <Select items={Object.fromEntries(accounts.map((a) => [a.id, a.name]))} name="toAccountId" required>
            <SelectTrigger className="w-full"><SelectValue placeholder="Destino" /></SelectTrigger>
            <SelectContent>
              {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Valor</Label>
          <CurrencyInput key={resetKey} name="amount" required />
        </div>
        <div className="space-y-1.5">
          <Label>Data</Label>
          <Input name="date" type="date" defaultValue={todayStr()} required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Descrição (opcional)</Label>
        <Input name="description" placeholder="Transferência" />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Salvando..." : "Transferir"}
      </Button>
    </form>
  );
}

type QuickAddContextValue = { open: boolean; setOpen: (open: boolean) => void };
const QuickAddContext = createContext<QuickAddContextValue | null>(null);

export function QuickAddProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <QuickAddContext.Provider value={{ open, setOpen }}>{children}</QuickAddContext.Provider>;
}

export function useQuickAdd() {
  const ctx = useContext(QuickAddContext);
  if (!ctx) throw new Error("useQuickAdd deve ser usado dentro de QuickAddProvider");
  return ctx;
}

/** Botão que abre o QuickAdd — usar dentro de headers de página; a FAB flutuante já cobre o acesso global. */
export function QuickAddTrigger({ children, className }: { children: React.ReactNode; className?: string }) {
  const { setOpen } = useQuickAdd();
  return (
    <Button className={className} onClick={() => setOpen(true)}>
      {children}
    </Button>
  );
}

export function QuickAdd({
  accounts,
  incomeCategories,
  expenseCategories,
  investmentCategories,
}: {
  accounts: Account[];
  incomeCategories: CategoryTree[];
  expenseCategories: CategoryTree[];
  investmentCategories: CategoryTree[];
}) {
  const { open, setOpen } = useQuickAdd();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        size="icon"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg md:bottom-8 md:right-8"
        aria-label="Adicionar lançamento"
      >
        <Plus className="h-6 w-6" />
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo lançamento</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="expense">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="income">Receita</TabsTrigger>
            <TabsTrigger value="expense">Despesa</TabsTrigger>
            <TabsTrigger value="transfer">Transf.</TabsTrigger>
            <TabsTrigger value="investment">Invest.</TabsTrigger>
          </TabsList>
          <TabsContent value="income" className="pt-2">
            <IncomeExpenseForm kind="INCOME" accounts={accounts} categories={incomeCategories} onDone={() => setOpen(false)} />
          </TabsContent>
          <TabsContent value="expense" className="pt-2">
            <IncomeExpenseForm kind="EXPENSE" accounts={accounts} categories={expenseCategories} onDone={() => setOpen(false)} />
          </TabsContent>
          <TabsContent value="transfer" className="pt-2">
            <TransferForm accounts={accounts} onDone={() => setOpen(false)} />
          </TabsContent>
          <TabsContent value="investment" className="pt-2">
            <IncomeExpenseForm kind="INVESTMENT" accounts={accounts} categories={investmentCategories} onDone={() => setOpen(false)} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
