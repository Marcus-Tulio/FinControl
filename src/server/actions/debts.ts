"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/server/session";
import { toNumber } from "@/lib/format";

export type DebtFormState = { error?: string; success?: boolean };

const debtSchema = z.object({
  name: z.string().min(1, "Informe um nome"),
  type: z.enum(["LOAN", "FINANCING", "INSTALLMENT", "CREDIT_CARD", "OTHER"]),
  originalAmount: z.coerce.number().positive("Informe um valor válido"),
  remainingAmount: z.coerce.number().min(0),
  interestRate: z.coerce.number().min(0).default(0),
  installmentsTotal: z.coerce.number().int().min(0).optional(),
  installmentsPaid: z.coerce.number().int().min(0).default(0),
  installmentAmount: z.coerce.number().min(0).optional(),
  dueDay: z.coerce.number().int().min(1).max(31).optional(),
  nextDueDate: z.string().optional(),
});

export async function createDebt(_prev: DebtFormState, formData: FormData): Promise<DebtFormState> {
  const userId = await requireUserId();
  const parsed = debtSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const { nextDueDate, ...rest } = parsed.data;
  await prisma.debt.create({
    data: { ...rest, userId, nextDueDate: nextDueDate ? new Date(nextDueDate) : null },
  });

  revalidatePath("/dividas");
  revalidatePath("/");
  return { success: true };
}

export async function updateDebt(id: string, _prev: DebtFormState, formData: FormData): Promise<DebtFormState> {
  const userId = await requireUserId();
  const debt = await prisma.debt.findFirst({ where: { id, userId } });
  if (!debt) return { error: "Dívida não encontrada" };

  const parsed = debtSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const { nextDueDate, ...rest } = parsed.data;
  await prisma.debt.update({
    where: { id },
    data: {
      ...rest,
      nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
      isPaidOff: rest.remainingAmount <= 0,
    },
  });

  revalidatePath("/dividas");
  revalidatePath("/");
  return { success: true };
}

export async function deleteDebt(id: string) {
  const userId = await requireUserId();
  const debt = await prisma.debt.findFirst({ where: { id, userId } });
  if (!debt) throw new Error("Dívida não encontrada");

  await prisma.debt.delete({ where: { id } });
  revalidatePath("/dividas");
  revalidatePath("/");
}

const paymentSchema = z.object({
  amount: z.coerce.number().positive("Informe um valor válido"),
  date: z.string().min(1),
  note: z.string().optional(),
});

export async function addDebtPayment(debtId: string, _prev: DebtFormState, formData: FormData): Promise<DebtFormState> {
  const userId = await requireUserId();
  const debt = await prisma.debt.findFirst({ where: { id: debtId, userId } });
  if (!debt) return { error: "Dívida não encontrada" };

  const parsed = paymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const { amount, date, note } = parsed.data;
  const newRemaining = Math.max(toNumber(debt.remainingAmount) - amount, 0);

  let nextDueDate = debt.nextDueDate;
  if (nextDueDate) {
    const d = new Date(nextDueDate);
    d.setMonth(d.getMonth() + 1);
    nextDueDate = d;
  }

  await prisma.$transaction([
    prisma.debtPayment.create({ data: { debtId, amount, date: new Date(date), note } }),
    prisma.debt.update({
      where: { id: debtId },
      data: {
        remainingAmount: newRemaining,
        installmentsPaid: debt.installmentsPaid + 1,
        isPaidOff: newRemaining <= 0,
        nextDueDate: newRemaining <= 0 ? null : nextDueDate,
      },
    }),
  ]);

  revalidatePath("/dividas");
  revalidatePath("/");
  return { success: true };
}
