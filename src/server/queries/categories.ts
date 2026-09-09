import "server-only";
import { prisma } from "@/lib/prisma";
import type { CategoryKind } from "@prisma/client";

/** Ordena por nome (pt-BR) mas mantém "Outros" sempre por último. */
function sortWithOutrosLast<T extends { name: string }>(items: T[]): T[] {
  const compare = (a: T, b: T) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
  const rest = items.filter((i) => i.name !== "Outros").sort(compare);
  const outros = items.filter((i) => i.name === "Outros").sort(compare);
  return [...rest, ...outros];
}

export async function listCategories(userId: string, kind?: CategoryKind) {
  return prisma.category.findMany({
    where: { userId, ...(kind ? { kind } : {}) },
    include: { subcategories: true },
    orderBy: [{ parentId: "asc" }, { name: "asc" }],
  });
}

export async function listTopLevelCategories(userId: string, kind?: CategoryKind) {
  const categories = await prisma.category.findMany({
    where: { userId, parentId: null, ...(kind ? { kind } : {}) },
    include: { subcategories: true },
  });
  return sortWithOutrosLast(categories).map((c) => ({
    ...c,
    subcategories: sortWithOutrosLast(c.subcategories),
  }));
}

export async function getCategoryById(userId: string, id: string) {
  return prisma.category.findFirst({ where: { id, userId } });
}
