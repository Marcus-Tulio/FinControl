import { requireUserId } from "@/server/session";
import { getBillsSummary } from "@/server/queries/transactions";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BillRow } from "@/components/bills/bill-row";
import { formatCurrency } from "@/lib/format";

export default async function ContasAPagarPage() {
  const userId = await requireUserId();
  const { today, upcoming, overdue, paidRecent } = await getBillsSummary(userId);

  const totalUpcoming = [...today, ...upcoming].reduce((s, t) => s + (t.kind === "EXPENSE" ? Number(t.amount) : 0), 0);
  const totalOverdue = overdue.reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div>
      <PageHeader title="Contas a pagar" description="Central de pagamentos e recebimentos." />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Vencendo hoje" value={String(today.length)} icon="calendar-clock" />
        <StatCard label="Previsto (próximos dias)" value={formatCurrency(totalUpcoming)} icon="calendar-days" />
        <StatCard label="Atrasadas" value={formatCurrency(totalOverdue)} icon="alert-triangle" tone={totalOverdue > 0 ? "negative" : "neutral"} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Vencendo hoje</CardTitle></CardHeader>
          <CardContent className="divide-y divide-border">
            {today.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">Nenhuma conta vence hoje.</p>
            ) : (
              today.map((t) => (
                <BillRow key={t.id} id={t.id} description={t.description} amount={Number(t.amount)} dueDate={t.dueDate!} kind={t.kind} categoryIcon={t.category?.icon} categoryColor={t.category?.color} accountName={t.financialAccount.name} />
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base text-destructive">Atrasadas</CardTitle></CardHeader>
          <CardContent className="divide-y divide-border">
            {overdue.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">Nenhuma conta atrasada. 🎉</p>
            ) : (
              overdue.map((t) => (
                <BillRow key={t.id} id={t.id} description={t.description} amount={Number(t.amount)} dueDate={t.dueDate!} kind={t.kind} categoryIcon={t.category?.icon} categoryColor={t.category?.color} accountName={t.financialAccount.name} tone="overdue" />
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Próximos vencimentos</CardTitle></CardHeader>
          <CardContent className="divide-y divide-border">
            {upcoming.length === 0 ? (
              <EmptyState icon="calendar-check" title="Nenhum vencimento futuro" />
            ) : (
              upcoming.map((t) => (
                <BillRow key={t.id} id={t.id} description={t.description} amount={Number(t.amount)} dueDate={t.dueDate!} kind={t.kind} categoryIcon={t.category?.icon} categoryColor={t.category?.color} accountName={t.financialAccount.name} />
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Pagas recentemente</CardTitle></CardHeader>
          <CardContent className="divide-y divide-border">
            {paidRecent.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">Nenhum pagamento recente.</p>
            ) : (
              paidRecent.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="truncate text-muted-foreground">{t.description}</span>
                  <span className="shrink-0 font-medium tabular-nums">{formatCurrency(t.amount as never)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
