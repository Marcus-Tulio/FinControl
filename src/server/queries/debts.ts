import "server-only";
import { prisma } from "@/lib/prisma";

export async function listDebts(userId: string) {
  return prisma.debt.findMany({
    where: { userId },
    include: { payments: { orderBy: { date: "desc" }, take: 5 } },
    orderBy: [{ isPaidOff: "asc" }, { nextDueDate: "asc" }],
  });
}

export async function getDebtById(userId: string, id: string) {
  return prisma.debt.findFirst({
    where: { id, userId },
    include: { payments: { orderBy: { date: "desc" } } },
  });
}
