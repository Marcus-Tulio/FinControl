"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { transferBetweenAccounts, type AccountFormState } from "@/server/actions/accounts";

type Account = { id: string; name: string };
const emptyState: AccountFormState = {};

export function TransferDialog({ accounts }: { accounts: Account[] }) {
  const [state, formAction, isPending] = useActionState(transferBetweenAccounts, emptyState);
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const accountItems = Object.fromEntries(accounts.map((a) => [a.id, a.name]));

  useEffect(() => {
    if (state.success) {
      toast.success("Transferência realizada");
      formRef.current?.reset();
      setOpen(false);
    }
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline"><ArrowLeftRight className="h-4 w-4" /> Transferir</Button>} />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Transferência entre contas</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>De</Label>
              <Select items={accountItems} name="fromAccountId" required>
                <SelectTrigger className="w-full"><SelectValue placeholder="Origem" /></SelectTrigger>
                <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Para</Label>
              <Select items={accountItems} name="toAccountId" required>
                <SelectTrigger className="w-full"><SelectValue placeholder="Destino" /></SelectTrigger>
                <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Valor</Label>
              <Input name="amount" type="number" step="0.01" min="0.01" required />
            </div>
            <div className="space-y-1.5">
              <Label>Data</Label>
              <Input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
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
      </DialogContent>
    </Dialog>
  );
}
