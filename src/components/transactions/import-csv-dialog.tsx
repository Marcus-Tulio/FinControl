"use client";

import { useActionState, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { importTransactionsCsv, type ImportResult } from "@/server/actions/import";

type Account = { id: string; name: string };

const emptyState: ImportResult = {};

export function ImportCsvDialog({ accounts }: { accounts: Account[] }) {
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const boundAction = importTransactionsCsv.bind(null, accountId);
  const [state, formAction, isPending] = useActionState(boundAction, emptyState);
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline"><Upload className="h-4 w-4" /> Importar CSV</Button>} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar transações via CSV</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            O arquivo deve conter colunas de data, descrição e valor (valores negativos são despesas, positivos são receitas).
            Transações duplicadas são detectadas automaticamente.
          </p>
          <div className="space-y-1.5">
            <Label>Conta de destino</Label>
            <Select items={Object.fromEntries(accounts.map((a) => [a.id, a.name]))} value={accountId} onValueChange={(v) => setAccountId(v ?? "")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="file">Arquivo CSV</Label>
            <input
              id="file"
              name="file"
              type="file"
              accept=".csv,text/csv"
              required
              className="w-full rounded-lg border border-input bg-transparent p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm"
            />
          </div>

          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          {state.imported !== undefined && (
            <Alert>
              <AlertDescription>
                {state.imported} transações importadas, {state.duplicates} duplicadas ignoradas (de {state.total} encontradas).
              </AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isPending || !accountId}>
            {isPending ? "Importando..." : "Importar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
