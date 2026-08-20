import { requireUserId } from "@/server/session";
import { getBudgetsForMonth, getCategoriesWithoutBudget } from "@/server/queries/budgets";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { DynamicIcon } from "@/components/dynamic-icon";
import { BudgetFormDialog } from "@/components/budget/budget-form-dialog";
import { formatCurrency, formatMonthYear } from "@/lib/format";
import { budgetStatus } from "@/lib/finance";

const STATUS_COLOR = {
  ok: "var(--status-good)",
  warning: "var(--status-warning)",
  danger: "var(--status-critical)",
};

export default async function OrcamentoPage() {
  const userId = await requireUserId();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [budgets, categoriesWithoutBudget] = await Promise.all([
    getBudgetsForMonth(userId, month, year),
    getCategoriesWithoutBudget(userId, month, year),
  ]);

  const totalLimit = budgets.reduce((s, b) => s + Number(b.limitAmount), 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

  return (
    <div>
      <PageHeader
        title="Orçamento"
        description={formatMonthYear(now)}
        actions={<BudgetFormDialog categories={categoriesWithoutBudget} month={month} year={year} />}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Orçamento total" value={formatCurrency(totalLimit)} icon="pie-chart" />
        <StatCard label="Gasto até agora" value={formatCurrency(totalSpent)} icon="trending-down" />
        <StatCard label="Disponível" value={formatCurrency(totalLimit - totalSpent)} icon="wallet" tone={totalLimit - totalSpent >= 0 ? "positive" : "negative"} />
      </div>

      {budgets.length === 0 ? (
        <EmptyState
          icon="pie-chart"
          title="Nenhum orçamento definido"
          description="Defina limites de gasto por categoria para acompanhar seus hábitos financeiros."
        />
      ) : (
        <div className="space-y-3">
          {budgets.map((budget) => {
            const status = budgetStatus(budget.limitAmount, budget.spent);
            return (
              <div key={budget.id} className="rounded-xl border border-border p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${budget.category.color}1a`, color: budget.category.color }}
                  >
                    <DynamicIcon name={budget.category.icon} className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{budget.category.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(status.spent)} de {formatCurrency(status.limit)} · disponível {formatCurrency(status.available)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums" style={{ color: STATUS_COLOR[status.level] }}>
                    {Math.round(status.percentUsed * 100)}%
                  </span>
                  <BudgetFormDialog
                    categories={[{ id: budget.categoryId, name: budget.category.name }]}
                    month={month}
                    year={year}
                    existing={{ categoryId: budget.categoryId, limitAmount: Number(budget.limitAmount) }}
                  />
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(status.percentUsed * 100, 100)}%`, backgroundColor: STATUS_COLOR[status.level] }}
                  />
                </div>
                {status.level === "danger" && (
                  <p className="mt-2 text-xs font-medium text-destructive">Orçamento ultrapassado!</p>
                )}
                {status.level === "warning" && (
                  <p className="mt-2 text-xs font-medium" style={{ color: STATUS_COLOR.warning }}>Você está perto do limite.</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
