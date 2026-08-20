import { requireUserId } from "@/server/session";
import {
  getSavingsRateSeries,
  getDebtsEvolution,
  getInvestmentsEvolution,
  getReportByAccount,
  getReportByCategory,
  getTransactionsForExport,
} from "@/server/queries/reports";
import { getNetWorthSeries, getIncomeVsExpenseSeries } from "@/server/queries/dashboard";
import { getPeriodRange } from "@/lib/period";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NetWorthChart } from "@/components/charts/net-worth-chart";
import { IncomeExpenseChart } from "@/components/charts/income-expense-chart";
import { PercentAreaChart } from "@/components/charts/percent-area-chart";
import { ExportButtons } from "@/components/reports/export-buttons";
import { formatCurrency, formatPercent } from "@/lib/format";

export default async function RelatoriosPage() {
  const userId = await requireUserId();
  const { start, end } = getPeriodRange("semester");

  const [savingsRate, debtsEvolution, investmentsEvolution, netWorth, incomeVsExpense, byAccount, byExpenseCategory, byIncomeCategory, exportData] =
    await Promise.all([
      getSavingsRateSeries(userId, 12),
      getDebtsEvolution(userId, 12),
      getInvestmentsEvolution(userId, 12),
      getNetWorthSeries(userId, 12),
      getIncomeVsExpenseSeries(userId, 12),
      getReportByAccount(userId, start, end),
      getReportByCategory(userId, "EXPENSE", start, end),
      getReportByCategory(userId, "INCOME", start, end),
      getTransactionsForExport(userId, start, end),
    ]);

  const avgSavingsRate = savingsRate.reduce((s, r) => s + r.savingsRate, 0) / (savingsRate.length || 1);

  const exportRows = exportData.map((t) => ({
    date: t.date,
    description: t.description,
    category: t.category?.name ?? "—",
    account: t.financialAccount.name,
    kind: t.kind,
    amount: Number(t.amount),
  }));

  return (
    <div>
      <PageHeader
        title="Relatórios"
        description="Análise avançada da sua vida financeira."
        actions={<ExportButtons rows={exportRows} title="relatorio-financeiro" />}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Evolução do patrimônio</CardTitle></CardHeader>
          <CardContent><NetWorthChart data={netWorth} /></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Receitas x despesas</CardTitle></CardHeader>
          <CardContent><IncomeExpenseChart data={incomeVsExpense} /></CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Taxa de economia</CardTitle>
            <p className="text-xs text-muted-foreground">Média dos últimos 12 meses: {formatPercent(avgSavingsRate)}</p>
          </CardHeader>
          <CardContent><PercentAreaChart data={savingsRate} dataKey="savingsRate" /></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Evolução das dívidas</CardTitle></CardHeader>
          <CardContent><NetWorthChart data={debtsEvolution.map((d) => ({ month: d.month, value: d.remaining }))} /></CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Evolução dos investimentos</CardTitle></CardHeader>
          <CardContent><NetWorthChart data={investmentsEvolution} /></CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Gastos por categoria</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {byExpenseCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados no período.</p>
            ) : byExpenseCategory.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />{c.name}</span>
                <span className="font-medium tabular-nums">{formatCurrency(c.total)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Receitas por categoria</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {byIncomeCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados no período.</p>
            ) : byIncomeCategory.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />{c.name}</span>
                <span className="font-medium tabular-nums">{formatCurrency(c.total)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Por conta</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {byAccount.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados no período.</p>
            ) : byAccount.map((a) => (
              <div key={a.accountId} className="text-sm">
                <p className="font-medium">{a.name}</p>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Receitas: {formatCurrency(a.income)}</span>
                  <span>Despesas: {formatCurrency(a.expense)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
