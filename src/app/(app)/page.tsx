import Link from "next/link";
import { requireUserId, getCurrentUser } from "@/server/session";
import { getDashboardSummary, getRecentTransactions } from "@/server/queries/dashboard";
import { getInsights } from "@/server/queries/insights";
import { getBudgetsForMonth } from "@/server/queries/budgets";
import { listAccountsWithBalances } from "@/server/queries/accounts";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { StatCardHero } from "@/components/dashboard/stat-card-hero";
import { StatCard } from "@/components/shared/stat-card";
import { RecentTransactionsCard } from "@/components/dashboard/recent-transactions-card";
import { AccountsSummaryList } from "@/components/dashboard/accounts-summary-list";
import { BudgetRow } from "@/components/budget/budget-row";
import { GoalProgressCard } from "@/components/shared/goal-progress-card";
import { InsightsList } from "@/components/shared/insights-list";
import { EmptyState } from "@/components/shared/empty-state";
import { IncomeExpenseChart } from "@/components/charts/income-expense-chart";
import { CategoryDonutChart } from "@/components/charts/category-donut-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatMonthYear } from "@/lib/format";
import { serializeDecimals } from "@/lib/serialize";
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

  const now = new Date();
  const [user, summary, insights, recentTransactions, budgets, accounts] = await Promise.all([
    getCurrentUser(),
    getDashboardSummary(userId, period),
    getInsights(userId),
    getRecentTransactions(userId, 6),
    getBudgetsForMonth(userId, now.getMonth() + 1, now.getFullYear()),
    listAccountsWithBalances(userId),
  ]);

  const greetingName = user?.name?.split(" ")[0] ?? "você";
  const topBudgets = budgets.slice(0, 4);
  const topAccounts = accounts.slice(0, 4);

  return (
    <div>
      <DashboardHeader monthLabel={formatMonthYear(now)} greetingName={greetingName} period={period} />

      {insights.length > 0 && (
        <Card className="mb-4 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <InsightsList insights={insights} />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardHero label="Patrimônio" value={formatCurrency(summary.totalBalance)} hint="Em contas e investimentos" icon="layers" />
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
        <StatCard
          label="Saldo do período"
          value={formatCurrency(summary.result)}
          icon="scale"
          tone={summary.result >= 0 ? "positive" : "negative"}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Receitas e despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <IncomeExpenseChart data={summary.incomeVsExpense} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Para onde vai seu dinheiro</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryDonutChart data={summary.categoryBreakdown} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Últimas transações</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentTransactionsCard transactions={serializeDecimals(recentTransactions)} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Orçamentos por categoria</CardTitle>
            </CardHeader>
            <CardContent>
              {topBudgets.length === 0 ? (
                <EmptyState icon="pie-chart" title="Sem orçamentos" description="Defina limites por categoria em Orçamentos." />
              ) : (
                <div className="space-y-4">
                  {topBudgets.map((budget) => (
                    <BudgetRow key={budget.id} category={budget.category} limitAmount={budget.limitAmount} spent={budget.spent} compact />
                  ))}
                  <div className="text-right">
                    <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/orcamento" />}>
                      Ver todos
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Minhas contas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2 text-xs text-muted-foreground">
                Disponível {formatCurrency(summary.availableBalance)} · A receber {formatCurrency(summary.receivable)} · A pagar{" "}
                {formatCurrency(summary.payable)}
              </p>
              <AccountsSummaryList accounts={topAccounts} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-4 rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Metas de economia</CardTitle>
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
