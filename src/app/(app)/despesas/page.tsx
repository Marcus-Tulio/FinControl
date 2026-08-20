import { requireUserId } from "@/server/session";
import { listTransactions } from "@/server/queries/transactions";
import { listAccountsWithBalances } from "@/server/queries/accounts";
import { listCategories } from "@/server/queries/categories";
import { PageHeader } from "@/components/shared/page-header";
import { TransactionsFilterBar } from "@/components/transactions/transactions-filter-bar";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { formatCurrency } from "@/lib/format";
import { getPeriodRange } from "@/lib/period";
import { serializeDecimals } from "@/lib/serialize";

export default async function DespesasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const userId = await requireUserId();
  const sp = await searchParams;
  const { start, end } = getPeriodRange("month");

  const [transactions, accounts, categories] = await Promise.all([
    listTransactions(userId, {
      search: sp.search,
      financialAccountId: sp.accountId,
      categoryId: sp.categoryId,
      kind: "EXPENSE",
    }),
    listAccountsWithBalances(userId),
    listCategories(userId, "EXPENSE"),
  ]);

  const accountOptions = accounts.map((a) => ({ id: a.id, name: a.name }));
  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name, kind: c.kind }));

  const monthTxs = transactions.filter((t) => t.date >= start && t.date <= end && t.status === "PAID");
  const monthTotal = monthTxs.reduce((s, t) => s + Number(t.amount), 0);
  const essentialTotal = monthTxs.filter((t) => t.isEssential).reduce((s, t) => s + Number(t.amount), 0);
  const nonEssentialTotal = monthTotal - essentialTotal;

  return (
    <div>
      <PageHeader
        title="Despesas"
        description="Contas fixas, variáveis, parcelas e assinaturas."
        actions={
          <TransactionFormDialog
            accounts={accountOptions}
            categories={categoryOptions}
            defaultKind="EXPENSE"
            triggerLabel="Nova despesa"
          />
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Gasto este mês" value={formatCurrency(monthTotal)} icon="trending-down" tone="negative" />
        <StatCard label="Despesas essenciais" value={formatCurrency(essentialTotal)} icon="shield-check" />
        <StatCard label="Despesas não essenciais" value={formatCurrency(nonEssentialTotal)} icon="sparkles" />
      </div>

      <TransactionsFilterBar accounts={accountOptions} categories={categoryOptions.map((c) => ({ id: c.id, name: c.name }))} showKindFilter={false} />
      <TransactionsTable transactions={serializeDecimals(transactions)} accounts={accountOptions} categories={categoryOptions} />
    </div>
  );
}
