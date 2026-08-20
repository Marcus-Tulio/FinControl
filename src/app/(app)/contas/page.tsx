import Link from "next/link";
import { requireUserId } from "@/server/session";
import { listAccountsWithBalances } from "@/server/queries/accounts";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { DynamicIcon } from "@/components/dynamic-icon";
import { AccountFormDialog } from "@/components/accounts/account-form-dialog";
import { TransferDialog } from "@/components/accounts/transfer-dialog";
import { ACCOUNT_TYPE_LABELS } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { serializeDecimals } from "@/lib/serialize";

export default async function ContasPage() {
  const userId = await requireUserId();
  const accounts = await listAccountsWithBalances(userId);
  const total = accounts.reduce((s, a) => s + a.balance, 0);
  const accountOptions = accounts.map((a) => ({ id: a.id, name: a.name }));

  return (
    <div>
      <PageHeader
        title="Contas"
        description={`Patrimônio em contas: ${formatCurrency(total)}`}
        actions={
          <>
            {accounts.length > 1 && <TransferDialog accounts={accountOptions} />}
            <AccountFormDialog />
          </>
        }
      />

      {accounts.length === 0 ? (
        <EmptyState icon="wallet" title="Nenhuma conta cadastrada" description="Crie sua primeira conta para começar a registrar transações." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id} className="relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${account.color}1a`, color: account.color }}>
                      <DynamicIcon name={account.icon} className="h-5 w-5" />
                    </div>
                    <div>
                      <Link href={`/contas/${account.id}`} className="font-medium hover:underline">{account.name}</Link>
                      <p className="text-xs text-muted-foreground">
                        {ACCOUNT_TYPE_LABELS[account.type]}{account.institution ? ` · ${account.institution}` : ""}
                      </p>
                    </div>
                  </div>
                  <AccountFormDialog account={serializeDecimals(account)} />
                </div>
                <p className="mt-4 text-2xl font-semibold tabular-nums tracking-tight">{formatCurrency(account.balance)}</p>
                <Link href={`/contas/${account.id}`} className="mt-2 inline-block text-xs font-medium text-primary hover:underline">
                  Ver histórico →
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
