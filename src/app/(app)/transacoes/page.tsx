import { requireUserId } from "@/server/session";
import { listTransactions } from "@/server/queries/transactions";
import { listAccountsWithBalances } from "@/server/queries/accounts";
import { listCategories } from "@/server/queries/categories";
import { PageHeader } from "@/components/shared/page-header";
import { TransactionsFilterBar } from "@/components/transactions/transactions-filter-bar";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";
import { ImportCsvDialog } from "@/components/transactions/import-csv-dialog";
import { serializeDecimals } from "@/lib/serialize";
import type { TransactionKind } from "@prisma/client";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const userId = await requireUserId();
  const sp = await searchParams;

  const [transactions, accounts, categories] = await Promise.all([
    listTransactions(userId, {
      search: sp.search,
      financialAccountId: sp.accountId,
      categoryId: sp.categoryId,
      kind: sp.kind as TransactionKind | undefined,
    }),
    listAccountsWithBalances(userId),
    listCategories(userId),
  ]);

  const accountOptions = accounts.map((a) => ({ id: a.id, name: a.name }));
  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name, kind: c.kind }));

  return (
    <div>
      <PageHeader
        title="Transações"
        description="Gerencie receitas, despesas, investimentos e ajustes."
        actions={
          <>
            <ImportCsvDialog accounts={accountOptions} />
            <TransactionFormDialog accounts={accountOptions} categories={categoryOptions} />
          </>
        }
      />
      <TransactionsFilterBar accounts={accountOptions} categories={categoryOptions.map((c) => ({ id: c.id, name: c.name }))} />
      <TransactionsTable transactions={serializeDecimals(transactions)} accounts={accountOptions} categories={categoryOptions} />
    </div>
  );
}
