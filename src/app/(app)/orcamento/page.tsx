import { requireUserId } from "@/server/session";
import { getBudgetsForMonth, getCategoriesWithoutBudget } from "@/server/queries/budgets";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { BudgetFormDialog } from "@/components/budget/budget-form-dialog";
import { BudgetRow } from "@/components/budget/budget-row";
import { formatCurrency, formatMonthYear } from "@/lib/format";

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
          {budgets.map((budget) => (
            <BudgetRow
              key={budget.id}
              category={budget.category}
              limitAmount={budget.limitAmount}
              spent={budget.spent}
              action={
                <BudgetFormDialog
                  categories={[{ id: budget.categoryId, name: budget.category.name }]}
                  month={month}
                  year={year}
                  existing={{ categoryId: budget.categoryId, limitAmount: Number(budget.limitAmount) }}
                />
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
