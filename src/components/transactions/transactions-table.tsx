"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Copy, Trash2, CheckCircle2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DynamicIcon } from "@/components/dynamic-icon";
import { EmptyState } from "@/components/shared/empty-state";
import { TransactionFormDialog } from "./transaction-form-dialog";
import { formatCurrency, formatDate } from "@/lib/format";
import { deleteTransaction, duplicateTransaction, markTransactionPaid } from "@/server/actions/transactions";
import type { TransactionKind } from "@prisma/client";

type Row = {
  id: string;
  kind: TransactionKind;
  status: string;
  description: string;
  notes: string | null;
  amount: unknown;
  date: Date;
  dueDate: Date | null;
  isEssential: boolean;
  financialAccountId: string;
  categoryId: string | null;
  category: { name: string; color: string; icon: string } | null;
  financialAccount: { name: string };
};

type Account = { id: string; name: string };
type Category = { id: string; name: string; kind: TransactionKind };

const KIND_STYLES: Record<string, { label: string; className: string }> = {
  INCOME: { label: "Receita", className: "text-[var(--status-good)]" },
  EXPENSE: { label: "Despesa", className: "text-destructive" },
  INVESTMENT: { label: "Investimento", className: "text-primary" },
  TRANSFER: { label: "Transferência", className: "text-muted-foreground" },
  ADJUSTMENT: { label: "Ajuste", className: "text-muted-foreground" },
};

const STATUS_STYLES: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PAID: { label: "Pago", variant: "secondary" },
  PENDING: { label: "Pendente", variant: "outline" },
  OVERDUE: { label: "Atrasado", variant: "destructive" },
  CANCELED: { label: "Cancelado", variant: "outline" },
};

export function TransactionsTable({
  transactions,
  accounts,
  categories,
}: {
  transactions: Row[];
  accounts: Account[];
  categories: Category[];
}) {
  const [, startTransition] = useTransition();
  const [editingTx, setEditingTx] = useState<Row | null>(null);

  function handleDelete(id: string) {
    if (!confirm("Excluir esta transação?")) return;
    startTransition(async () => {
      await deleteTransaction(id);
      toast.success("Transação excluída");
    });
  }

  function handleDuplicate(id: string) {
    startTransition(async () => {
      await duplicateTransaction(id);
      toast.success("Transação duplicada");
    });
  }

  function handleMarkPaid(id: string) {
    startTransition(async () => {
      await markTransactionPaid(id);
      toast.success("Marcada como paga");
    });
  }

  if (transactions.length === 0) {
    return <EmptyState icon="search" title="Nenhuma transação encontrada" description="Ajuste os filtros ou cadastre uma nova transação." />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descrição</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Conta</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => {
            const kindStyle = KIND_STYLES[tx.kind] ?? KIND_STYLES.EXPENSE;
            const statusStyle = STATUS_STYLES[tx.status] ?? STATUS_STYLES.PAID;
            const sign = tx.kind === "INCOME" ? "+" : tx.kind === "EXPENSE" || tx.kind === "INVESTMENT" ? "-" : "";

            return (
              <TableRow key={tx.id}>
                <TableCell className="max-w-[220px]">
                  <p className="truncate font-medium">{tx.description}</p>
                  <p className={`text-xs ${kindStyle.className}`}>{kindStyle.label}</p>
                </TableCell>
                <TableCell>
                  {tx.category ? (
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full" style={{ backgroundColor: `${tx.category.color}1a`, color: tx.category.color }}>
                        <DynamicIcon name={tx.category.icon} className="h-3 w-3" />
                      </span>
                      {tx.category.name}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{tx.financialAccount.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(tx.date)}</TableCell>
                <TableCell>
                  <Badge variant={statusStyle.variant}>{statusStyle.label}</Badge>
                </TableCell>
                <TableCell className={`text-right font-medium tabular-nums ${kindStyle.className}`}>
                  {sign} {formatCurrency(tx.amount as never)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingTx(tx)}>
                        <Pencil className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      {(tx.status === "PENDING" || tx.status === "OVERDUE") && (
                        <DropdownMenuItem onClick={() => handleMarkPaid(tx.id)}>
                          <CheckCircle2 className="mr-2 h-4 w-4" /> Marcar como pago
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleDuplicate(tx.id)}>
                        <Copy className="mr-2 h-4 w-4" /> Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => handleDelete(tx.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {editingTx && (
        <TransactionFormDialog
          key={editingTx.id}
          accounts={accounts}
          categories={categories}
          open={Boolean(editingTx)}
          onOpenChange={(o) => !o && setEditingTx(null)}
          transaction={{
            id: editingTx.id,
            kind: editingTx.kind,
            financialAccountId: editingTx.financialAccountId,
            categoryId: editingTx.categoryId,
            description: editingTx.description,
            notes: editingTx.notes,
            amount: Number(editingTx.amount),
            date: editingTx.date,
            status: editingTx.status,
            isEssential: editingTx.isEssential,
          }}
        />
      )}
    </div>
  );
}
