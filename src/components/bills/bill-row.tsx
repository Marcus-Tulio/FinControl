"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DynamicIcon } from "@/components/dynamic-icon";
import { formatCurrency, formatDate } from "@/lib/format";
import { markTransactionPaid } from "@/server/actions/transactions";
import type { TransactionKind } from "@prisma/client";

export function BillRow({
  id,
  description,
  amount,
  dueDate,
  kind,
  categoryIcon,
  categoryColor,
  accountName,
  tone = "default",
}: {
  id: string;
  description: string;
  amount: number;
  dueDate: Date;
  kind: TransactionKind;
  categoryIcon?: string;
  categoryColor?: string;
  accountName: string;
  tone?: "default" | "overdue";
}) {
  const [isPending, startTransition] = useTransition();

  function handleMarkPaid() {
    startTransition(async () => {
      await markTransactionPaid(id);
      toast.success("Marcada como paga");
    });
  }

  return (
    <div className="flex items-center gap-3 py-3">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${categoryColor ?? "#64748b"}1a`, color: categoryColor ?? "#64748b" }}
      >
        <DynamicIcon name={categoryIcon ?? "receipt"} className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{description}</p>
        <p className={`text-xs ${tone === "overdue" ? "text-destructive" : "text-muted-foreground"}`}>
          {accountName} · vence {formatDate(dueDate)}
        </p>
      </div>
      <p className={`shrink-0 text-sm font-semibold tabular-nums ${kind === "INCOME" ? "text-[var(--status-good)]" : ""}`}>
        {kind === "INCOME" ? "+" : "-"} {formatCurrency(amount)}
      </p>
      <Button variant="outline" size="sm" className="shrink-0" onClick={handleMarkPaid} disabled={isPending}>
        <CheckCircle2 className="h-3.5 w-3.5" /> {kind === "INCOME" ? "Recebido" : "Pago"}
      </Button>
    </div>
  );
}
