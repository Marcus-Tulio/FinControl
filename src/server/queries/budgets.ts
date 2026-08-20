import "server-only";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/format";

export async function getBudgetsForMonth(userId: string, month: number, year: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const [budgets, spentByCategory] = await Promise.all([
    prisma.budget.findMany({
      where: { userId, month, year },
      include: { category: true },
      orderBy: { category: { name: "asc" } },
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, kind: "EXPENSE", status: "PAID", date: { gte: start, lte: end }, categoryId: { not: null } },
      _sum: { amount: true },
    }),
  ]);

  const spentMap = new Map(spentByCategory.map((s) => [s.categoryId, toNumber(s._sum.amount)]));

  return budgets.map((b) => ({
    ...b,
    spent: spentMap.get(b.categoryId) ?? 0,
  }));
}

export async function getCategoriesWithoutBudget(userId: string, month: number, year: number) {
  return prisma.category.findMany({
    where: {
      userId,
      kind: "EXPENSE",
      budgets: { none: { month, year } },
    },
    orderBy: { name: "asc" },
  });
}
