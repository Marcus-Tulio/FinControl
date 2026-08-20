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

export default async function ReceitasPage({
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
      kind: "INCOME",
    }),
    listAccountsWithBalances(userId),
    listCategories(userId, "INCOME"),
  ]);

  const accountOptions = accounts.map((a) => ({ id: a.id, name: a.name }));
  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name, kind: c.kind }));

  const monthTotal = transactions
    .filter((t) => t.date >= start && t.date <= end && t.status === "PAID")
    .reduce((s, t) => s + Number(t.amount), 0);
  const pendingTotal = transactions.filter((t) => t.status !== "PAID").reduce((s, t) => s + Number(t.amount), 0);
  const recurringCount = transactions.filter((t) => t.recurringRuleId).length;

  return (
    <div>
      <PageHeader
        title="Receitas"
        description="Salário, freelance, rendimentos e outras fontes de renda."
        actions={
          <TransactionFormDialog
            accounts={accountOptions}
            categories={categoryOptions}
            defaultKind="INCOME"
            triggerLabel="Nova receita"
          />
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Recebido este mês" value={formatCurrency(monthTotal)} icon="trending-up" tone="positive" />
        <StatCard label="A receber" value={formatCurrency(pendingTotal)} icon="arrow-down-circle" />
        <StatCard label="Receitas recorrentes" value={String(recurringCount)} icon="repeat" />
      </div>

      <TransactionsFilterBar accounts={accountOptions} categories={categoryOptions.map((c) => ({ id: c.id, name: c.name }))} showKindFilter={false} />
      <TransactionsTable transactions={serializeDecimals(transactions)} accounts={accountOptions} categories={categoryOptions} />
    </div>
  );
}
