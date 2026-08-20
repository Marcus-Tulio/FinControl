import "server-only";
import { prisma } from "@/lib/prisma";
import type { CategoryKind } from "@prisma/client";

export async function listCategories(userId: string, kind?: CategoryKind) {
  return prisma.category.findMany({
    where: { userId, ...(kind ? { kind } : {}) },
    include: { subcategories: true },
    orderBy: [{ parentId: "asc" }, { name: "asc" }],
  });
}

export async function listTopLevelCategories(userId: string, kind?: CategoryKind) {
  return prisma.category.findMany({
    where: { userId, parentId: null, ...(kind ? { kind } : {}) },
    include: { subcategories: { orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
  });
}

export async function getCategoryById(userId: string, id: string) {
  return prisma.category.findFirst({ where: { id, userId } });
}
