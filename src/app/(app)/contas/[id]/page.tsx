import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireUserId } from "@/server/session";
import { getAccountWithHistory, listAccountsWithBalances } from "@/server/queries/accounts";
import { listCategories } from "@/server/queries/categories";
import { PageHeader } from "@/components/shared/page-header";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import { DynamicIcon } from "@/components/dynamic-icon";
import { ACCOUNT_TYPE_LABELS } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { serializeDecimals } from "@/lib/serialize";

export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;

  const [data, accounts, categories] = await Promise.all([
    getAccountWithHistory(userId, id),
    listAccountsWithBalances(userId),
    listCategories(userId),
  ]);

  if (!data) notFound();

  const { account, balance, transactions } = data;
  const accountOptions = accounts.map((a) => ({ id: a.id, name: a.name }));
  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name, kind: c.kind }));

  return (
    <div>
      <Link href="/contas" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Contas
      </Link>
      <PageHeader
        title={account.name}
        description={`${ACCOUNT_TYPE_LABELS[account.type]}${account.institution ? ` · ${account.institution}` : ""}`}
      />

      <div className="mb-6 flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: `${account.color}1a`, color: account.color }}>
          <DynamicIcon name={account.icon} className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Saldo atual</p>
          <p className="text-2xl font-semibold tabular-nums tracking-tight">{formatCurrency(balance)}</p>
        </div>
      </div>

      <h2 className="mb-3 text-sm font-medium text-muted-foreground">Histórico de movimentações</h2>
      <TransactionsTable transactions={serializeDecimals(transactions)} accounts={accountOptions} categories={categoryOptions} />
    </div>
  );
}
