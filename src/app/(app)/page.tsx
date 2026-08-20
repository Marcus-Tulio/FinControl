import Link from "next/link";
import { requireUserId } from "@/server/session";
import { getDashboardSummary } from "@/server/queries/dashboard";
import { getInsights } from "@/server/queries/insights";
import { PeriodSelector } from "@/components/shared/period-selector";
import { StatCard } from "@/components/shared/stat-card";
import { GoalProgressCard } from "@/components/shared/goal-progress-card";
import { InsightsList } from "@/components/shared/insights-list";
import { EmptyState } from "@/components/shared/empty-state";
import { NetWorthChart } from "@/components/charts/net-worth-chart";
import { IncomeExpenseChart } from "@/components/charts/income-expense-chart";
import { CategoryDonutChart } from "@/components/charts/category-donut-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import type { PeriodKey } from "@/lib/period";

const VALID_PERIODS: PeriodKey[] = ["today", "week", "month", "quarter", "semester", "year"];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const userId = await requireUserId();
  const { period: periodParam } = await searchParams;
  const period = VALID_PERIODS.includes(periodParam as PeriodKey) ? (periodParam as PeriodKey) : "month";

  const [summary, insights] = await Promise.all([getDashboardSummary(userId, period), getInsights(userId)]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sua vida financeira em um só lugar.</p>
        </div>
        <PeriodSelector current={period} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Patrimônio total" value={formatCurrency(summary.totalBalance)} icon="layers" />
        <StatCard label="Saldo disponível" value={formatCurrency(summary.availableBalance)} icon="wallet" />
        <StatCard
          label="Receitas do período"
          value={formatCurrency(summary.income)}
          icon="trending-up"
          tone="positive"
          change={summary.incomeChange}
          changeLabel="vs. período anterior"
        />
        <StatCard
          label="Despesas do período"
          value={formatCurrency(summary.expense)}
          icon="trending-down"
          tone="negative"
          change={summary.expenseChange !== null ? -summary.expenseChange : null}
          changeLabel="vs. período anterior"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Resultado do período"
          value={formatCurrency(summary.result)}
          icon="scale"
          tone={summary.result >= 0 ? "positive" : "negative"}
        />
        <StatCard label="Valores a receber" value={formatCurrency(summary.receivable)} icon="arrow-down-circle" />
        <StatCard label="Valores a pagar" value={formatCurrency(summary.payable)} icon="arrow-up-circle" />
        <StatCard label="Faturas de cartão" value={formatCurrency(summary.cardBills)} icon="credit-card" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Evolução financeira</CardTitle>
          </CardHeader>
          <CardContent>
            <NetWorthChart data={summary.netWorthSeries} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <InsightsList insights={insights} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Receitas x despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <IncomeExpenseChart data={summary.incomeVsExpense} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gastos por categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryDonutChart data={summary.categoryBreakdown} />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Metas em andamento</CardTitle>
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/metas" />}>
            Ver todas
          </Button>
        </CardHeader>
        <CardContent>
          {summary.goals.length === 0 ? (
            <EmptyState
              icon="target"
              title="Nenhuma meta em andamento"
              description="Crie uma meta para começar a planejar seu futuro financeiro."
              action={
                <Button size="sm" nativeButton={false} render={<Link href="/metas" />}>
                  Criar meta
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {summary.goals.map((goal) => (
                <GoalProgressCard
                  key={goal.id}
                  name={goal.name}
                  icon={goal.icon}
                  color={goal.color}
                  targetAmount={Number(goal.targetAmount)}
                  currentAmount={Number(goal.currentAmount)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
