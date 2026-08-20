import { requireUserId } from "@/server/session";
import { getPortfolioSummary } from "@/server/queries/investments";
import { getInvestmentsEvolution } from "@/server/queries/reports";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NetWorthChart } from "@/components/charts/net-worth-chart";
import { CategoryDonutChart } from "@/components/charts/category-donut-chart";
import { InvestmentFormDialog } from "@/components/investments/investment-form-dialog";
import { InvestmentMovementDialog } from "@/components/investments/investment-movement-dialog";
import { DeleteIconButton } from "@/components/shared/delete-icon-button";
import { deleteInvestment } from "@/server/actions/investments";
import { formatCurrency, formatPercent } from "@/lib/format";
import { INVESTMENT_TYPE_LABELS } from "@/lib/constants";
import { serializeDecimals } from "@/lib/serialize";

export default async function InvestimentosPage() {
  const userId = await requireUserId();
  const [summary, evolution] = await Promise.all([
    getPortfolioSummary(userId),
    getInvestmentsEvolution(userId, 12),
  ]);

  const allocationData = summary.allocation.map((a) => ({ name: INVESTMENT_TYPE_LABELS[a.type as keyof typeof INVESTMENT_TYPE_LABELS], value: a.value }));

  return (
    <div>
      <PageHeader title="Investimentos" description="Acompanhe sua carteira e rentabilidade." actions={<InvestmentFormDialog />} />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Patrimônio investido" value={formatCurrency(summary.totalValue)} icon="line-chart" />
        <StatCard label="Total aportado" value={formatCurrency(summary.totalInvested)} icon="wallet" />
        <StatCard
          label="Lucro/prejuízo"
          value={formatCurrency(summary.totalProfit)}
          icon={summary.totalProfit >= 0 ? "trending-up" : "trending-down"}
          tone={summary.totalProfit >= 0 ? "positive" : "negative"}
          change={summary.totalProfitPercent}
          changeLabel="de rentabilidade"
        />
        <StatCard label="Dividendos recebidos" value={formatCurrency(summary.totalDividends)} icon="coins" tone="positive" />
      </div>

      {summary.investments.length === 0 ? (
        <EmptyState icon="line-chart" title="Nenhum investimento cadastrado" description="Registre seus ativos para acompanhar sua evolução patrimonial." />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-base">Evolução patrimonial</CardTitle></CardHeader>
              <CardContent><NetWorthChart data={evolution} /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Distribuição da carteira</CardTitle></CardHeader>
              <CardContent><CategoryDonutChart data={allocationData} /></CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {summary.investments.map((inv) => (
              <Card key={inv.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{inv.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {INVESTMENT_TYPE_LABELS[inv.type]}{inv.broker ? ` · ${inv.broker}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <InvestmentFormDialog investment={serializeDecimals(inv)} />
                      <DeleteIconButton onDelete={deleteInvestment.bind(null, inv.id)} confirmMessage="Excluir este investimento?" successMessage="Investimento excluído" />
                    </div>
                  </div>

                  <p className="mt-3 text-xl font-semibold tabular-nums">{formatCurrency(inv.currentValue)}</p>
                  <p className={`text-xs font-medium ${inv.profit >= 0 ? "text-[var(--status-good)]" : "text-destructive"}`}>
                    {inv.profit >= 0 ? "+" : ""}{formatCurrency(inv.profit)} ({formatPercent(inv.profitPercent)})
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <p>Qtd: {Number(inv.quantity)}</p>
                    <p>Preço atual: {formatCurrency(inv.currentPrice as never)}</p>
                    <p>Aportado: {formatCurrency(inv.invested)}</p>
                    <p>Dividendos: {formatCurrency(inv.dividends)}</p>
                  </div>

                  <div className="mt-4">
                    <InvestmentMovementDialog investmentId={inv.id} name={inv.name} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
