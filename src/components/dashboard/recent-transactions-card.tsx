import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency, formatDate } from "@/lib/format";
import type { TransactionKind } from "@prisma/client";

type Row = {
  id: string;
  kind: TransactionKind;
  status: string;
  description: string;
  amount: unknown;
  date: Date;
  category: { name: string } | null;
  financialAccount: { name: string };
};

const STATUS_STYLES: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PAID: { label: "Pago", variant: "secondary" },
  PENDING: { label: "Pendente", variant: "outline" },
  OVERDUE: { label: "Atrasado", variant: "destructive" },
  CANCELED: { label: "Cancelado", variant: "outline" },
};

export function RecentTransactionsCard({ transactions }: { transactions: Row[] }) {
  if (transactions.length === 0) {
    return <EmptyState icon="arrow-left-right" title="Nenhuma transação ainda" description="Registre sua primeira transação para começar." />;
  }

  return (
    <div className="space-y-1">
      {transactions.map((tx) => {
        const isIncome = tx.kind === "INCOME";
        const isOutflow = tx.kind === "EXPENSE" || tx.kind === "INVESTMENT";
        const statusStyle = STATUS_STYLES[tx.status] ?? STATUS_STYLES.PAID;
        const sign = isIncome ? "+" : isOutflow ? "−" : "";

        return (
          <div key={tx.id} className="flex items-center gap-3 rounded-lg px-1 py-2">
            <div
              className={
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full " +
                (isIncome ? "bg-positive-soft text-positive" : "bg-negative-soft text-negative")
              }
            >
              {isIncome ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{tx.description}</p>
              <p className="truncate text-xs text-muted-foreground">
                {tx.category?.name ?? "Sem categoria"} · {tx.financialAccount.name} · {formatDate(tx.date)}
              </p>
            </div>
            <Badge variant={statusStyle.variant} className="shrink-0">
              {statusStyle.label}
            </Badge>
            <span className={"w-24 shrink-0 text-right text-sm font-semibold tabular-nums " + (isIncome ? "text-positive" : isOutflow ? "text-negative" : "text-muted-foreground")}>
              {sign} {formatCurrency(tx.amount as never)}
            </span>
          </div>
        );
      })}
      <div className="pt-2 text-right">
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/transacoes" />}>
          Ver todas
        </Button>
      </div>
    </div>
  );
}
