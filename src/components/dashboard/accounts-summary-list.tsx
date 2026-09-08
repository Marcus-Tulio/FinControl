import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency } from "@/lib/format";
import { ACCOUNT_TYPE_LABELS } from "@/lib/constants";
import type { FinancialAccountType } from "@prisma/client";

type Row = {
  id: string;
  name: string;
  type: FinancialAccountType;
  institution: string | null;
  balance: number;
};

export function AccountsSummaryList({ accounts }: { accounts: Row[] }) {
  if (accounts.length === 0) {
    return <EmptyState icon="wallet" title="Nenhuma conta cadastrada" description="Cadastre suas contas para acompanhar o saldo." />;
  }

  return (
    <div className="space-y-1">
      {accounts.map((account) => (
        <div key={account.id} className="flex items-center justify-between gap-3 rounded-lg px-1 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{account.name}</p>
            <p className="truncate text-xs text-muted-foreground">{account.institution ?? ACCOUNT_TYPE_LABELS[account.type]}</p>
          </div>
          <span className={"shrink-0 text-sm font-semibold tabular-nums " + (account.balance < 0 ? "text-negative" : "")}>
            {formatCurrency(account.balance)}
          </span>
        </div>
      ))}
      <div className="pt-2 text-right">
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/contas" />}>
          Ver todas
        </Button>
      </div>
    </div>
  );
}
