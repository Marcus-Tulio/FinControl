import "server-only";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/format";

export async function getBudgetsForMonth(userId: string, month: number, year: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const [budgets, spentByCategory, allCategories] = await Promise.all([
    prisma.budget.findMany({
      where: { userId, month, year },
      include: { category: { include: { parent: true } } },
      orderBy: { category: { name: "asc" } },
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, kind: "EXPENSE", status: "PAID", date: { gte: start, lte: end }, categoryId: { not: null } },
      _sum: { amount: true },
    }),
    prisma.category.findMany({ where: { userId, kind: "EXPENSE" }, select: { id: true, parentId: true } }),
  ]);

  const spentMap = new Map(spentByCategory.map((s) => [s.categoryId, toNumber(s._sum.amount)]));
  const childrenOf = new Map<string, string[]>();
  for (const c of allCategories) {
    if (c.parentId) childrenOf.set(c.parentId, [...(childrenOf.get(c.parentId) ?? []), c.id]);
  }

  return budgets.map((b) => {
    // Orçamento sem subcategoria definida: genérico, soma o gasto da categoria e de todas as suas subcategorias.
    const isGeneric = b.category.parentId === null;
    const targetIds = isGeneric ? [b.categoryId, ...(childrenOf.get(b.categoryId) ?? [])] : [b.categoryId];
    const spent = targetIds.reduce((sum, id) => sum + (spentMap.get(id) ?? 0), 0);
    return { ...b, spent };
  });
}
