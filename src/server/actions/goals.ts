"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/server/session";
import { toNumber } from "@/lib/format";

export type GoalFormState = { error?: string; success?: boolean };

const goalSchema = z.object({
  name: z.string().min(1, "Informe um nome"),
  type: z.enum(["EMERGENCY_FUND", "TRAVEL", "CAR", "HOUSE", "INVESTMENT", "DEBT_PAYOFF", "CUSTOM"]),
  icon: z.string().default("target"),
  color: z.string().default("#6366f1"),
  targetAmount: z.coerce.number().positive("Informe um valor válido"),
  currentAmount: z.coerce.number().min(0).default(0),
  targetDate: z.string().optional(),
});

export async function createGoal(_prev: GoalFormState, formData: FormData): Promise<GoalFormState> {
  const userId = await requireUserId();
  const raw = Object.fromEntries(formData);
  const parsed = goalSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const { targetDate, ...rest } = parsed.data;
  await prisma.goal.create({
    data: { ...rest, userId, targetDate: targetDate ? new Date(targetDate) : null },
  });

  revalidatePath("/metas");
  revalidatePath("/");
  return { success: true };
}

export async function updateGoal(id: string, _prev: GoalFormState, formData: FormData): Promise<GoalFormState> {
  const userId = await requireUserId();
  const goal = await prisma.goal.findFirst({ where: { id, userId } });
  if (!goal) return { error: "Meta não encontrada" };

  const raw = Object.fromEntries(formData);
  const parsed = goalSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const { targetDate, ...rest } = parsed.data;
  await prisma.goal.update({
    where: { id },
    data: { ...rest, targetDate: targetDate ? new Date(targetDate) : null },
  });

  revalidatePath("/metas");
  revalidatePath("/");
  return { success: true };
}

export async function deleteGoal(id: string) {
  const userId = await requireUserId();
  const goal = await prisma.goal.findFirst({ where: { id, userId } });
  if (!goal) throw new Error("Meta não encontrada");

  await prisma.goal.delete({ where: { id } });
  revalidatePath("/metas");
  revalidatePath("/");
}

const contributionSchema = z.object({
  amount: z.coerce.number().positive("Informe um valor válido"),
  date: z.string().min(1),
  note: z.string().optional(),
});

export async function addGoalContribution(goalId: string, _prev: GoalFormState, formData: FormData): Promise<GoalFormState> {
  const userId = await requireUserId();
  const goal = await prisma.goal.findFirst({ where: { id: goalId, userId } });
  if (!goal) return { error: "Meta não encontrada" };

  const parsed = contributionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const { amount, date, note } = parsed.data;

  await prisma.$transaction([
    prisma.goalContribution.create({
      data: { goalId, amount, date: new Date(date), note },
    }),
    prisma.goal.update({
      where: { id: goalId },
      data: {
        currentAmount: toNumber(goal.currentAmount) + amount,
        isCompleted: toNumber(goal.currentAmount) + amount >= toNumber(goal.targetAmount),
      },
    }),
  ]);

  revalidatePath("/metas");
  revalidatePath("/");
  return { success: true };
}
