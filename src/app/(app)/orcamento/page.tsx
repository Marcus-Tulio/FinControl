import { requireUserId } from "@/server/session";
import { getBudgetsForMonth } from "@/server/queries/budgets";
import { listTopLevelCategories } from "@/server/queries/categories";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { BudgetFormDialog } from "@/components/budget/budget-form-dialog";
import { BudgetRow } from "@/components/budget/budget-row";
import { formatCurrency, formatMonthYear } from "@/lib/format";
import type { CategoryTree } from "@/components/shared/category-picker";

/** Remove da árvore as categorias/subcategorias que já têm orçamento neste mês, mantendo a categoria-mãe se ainda houver subcategoria livre. */
function categoriesAvailableForNewBudget(tree: CategoryTree[], takenIds: Set<string>): CategoryTree[] {
  return tree
    .map((c) => ({ ...c, subcategories: c.subcategories.filter((s) => !takenIds.has(s.id)) }))
    .filter((c) => !takenIds.has(c.id) || c.subcategories.length > 0);
}

export default async function OrcamentoPage() {
  const userId = await requireUserId();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [budgets, categoriesTree] = await Promise.all([
    getBudgetsForMonth(userId, month, year),
    listTopLevelCategories(userId, "EXPENSE"),
  ]);

  const takenIds = new Set(budgets.map((b) => b.categoryId));
  const availableCategories = categoriesAvailableForNewBudget(categoriesTree, takenIds);

  const totalLimit = budgets.reduce((s, b) => s + Number(b.limitAmount), 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

  return (
    <div>
      <PageHeader
        title="Orçamento"
        description={formatMonthYear(now)}
        actions={<BudgetFormDialog categories={availableCategories} month={month} year={year} />}
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
                  categories={categoriesTree}
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
