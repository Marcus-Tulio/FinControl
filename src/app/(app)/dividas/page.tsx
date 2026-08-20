import { requireUserId } from "@/server/session";
import { listDebts } from "@/server/queries/debts";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { DebtFormDialog } from "@/components/debts/debt-form-dialog";
import { DebtPaymentDialog } from "@/components/debts/debt-payment-dialog";
import { DeleteIconButton } from "@/components/shared/delete-icon-button";
import { deleteDebt } from "@/server/actions/debts";
import { formatCurrency, formatDate } from "@/lib/format";
import { debtPayoffProjection } from "@/lib/finance";
import { DEBT_TYPE_LABELS } from "@/lib/constants";
import { serializeDecimals } from "@/lib/serialize";

export default async function DividasPage() {
  const userId = await requireUserId();
  const debts = await listDebts(userId);

  const totalRemaining = debts.filter((d) => !d.isPaidOff).reduce((s, d) => s + Number(d.remainingAmount), 0);
  const totalMonthly = debts.filter((d) => !d.isPaidOff).reduce((s, d) => s + Number(d.installmentAmount ?? 0), 0);

  return (
    <div>
      <PageHeader title="Dívidas" description="Empréstimos, financiamentos, parcelamentos e cartões." actions={<DebtFormDialog />} />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total em dívidas" value={formatCurrency(totalRemaining)} icon="landmark" tone="negative" />
        <StatCard label="Compromisso mensal" value={formatCurrency(totalMonthly)} icon="calendar-clock" />
        <StatCard label="Dívidas ativas" value={String(debts.filter((d) => !d.isPaidOff).length)} icon="file-text" />
      </div>

      {debts.length === 0 ? (
        <EmptyState icon="landmark" title="Nenhuma dívida cadastrada" description="Registre suas dívidas para acompanhar a quitação." />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {debts.map((debt) => {
            const original = Number(debt.originalAmount);
            const remaining = Number(debt.remainingAmount);
            const paidPercent = original > 0 ? Math.min(1 - remaining / original, 1) : 0;
            const { installmentsLeft, payoffDate } = debtPayoffProjection({
              remainingAmount: debt.remainingAmount,
              installmentAmount: debt.installmentAmount,
              installmentsTotal: debt.installmentsTotal,
              installmentsPaid: debt.installmentsPaid,
              nextDueDate: debt.nextDueDate,
            });

            return (
              <Card key={debt.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{debt.name}</p>
                        {debt.isPaidOff && <Badge variant="secondary">Quitada</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{DEBT_TYPE_LABELS[debt.type]}</p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <DebtFormDialog debt={serializeDecimals(debt)} />
                      <DeleteIconButton onDelete={deleteDebt.bind(null, debt.id)} confirmMessage="Excluir esta dívida?" successMessage="Dívida excluída" />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Valor restante</p>
                      <p className="font-semibold tabular-nums">{formatCurrency(remaining)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Valor original</p>
                      <p className="font-semibold tabular-nums">{formatCurrency(original)}</p>
                    </div>
                    {debt.interestRate ? (
                      <div>
                        <p className="text-xs text-muted-foreground">Juros</p>
                        <p className="font-semibold tabular-nums">{Number(debt.interestRate)}% a.m.</p>
                      </div>
                    ) : null}
                    {!debt.isPaidOff && debt.nextDueDate && (
                      <div>
                        <p className="text-xs text-muted-foreground">Próximo vencimento</p>
                        <p className="font-semibold">{formatDate(debt.nextDueDate)}</p>
                      </div>
                    )}
                  </div>

                  <Progress value={paidPercent * 100} className="mt-4 h-2" />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {Math.round(paidPercent * 100)}% quitado
                    {debt.installmentsTotal ? ` · ${debt.installmentsPaid}/${debt.installmentsTotal} parcelas` : ""}
                  </p>

                  {!debt.isPaidOff && payoffDate && (
                    <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                      Previsão de quitação: <strong className="text-foreground">{formatDate(payoffDate)}</strong>
                      {installmentsLeft > 0 ? ` (${installmentsLeft} parcelas restantes)` : ""}
                    </p>
                  )}

                  {!debt.isPaidOff && (
                    <div className="mt-4">
                      <DebtPaymentDialog debtId={debt.id} debtName={debt.name} suggestedAmount={debt.installmentAmount ? Number(debt.installmentAmount) : undefined} />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
