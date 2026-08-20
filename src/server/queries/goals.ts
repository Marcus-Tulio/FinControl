import "server-only";
import { prisma } from "@/lib/prisma";

export async function listGoals(userId: string) {
  return prisma.goal.findMany({
    where: { userId },
    include: { contributions: { orderBy: { date: "desc" }, take: 5 } },
    orderBy: [{ isCompleted: "asc" }, { createdAt: "desc" }],
  });
}

export async function getGoalById(userId: string, id: string) {
  return prisma.goal.findFirst({
    where: { id, userId },
    include: { contributions: { orderBy: { date: "desc" } } },
  });
}
