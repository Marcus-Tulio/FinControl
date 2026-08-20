"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/server/session";

const accountSchema = z.object({
  name: z.string().min(1, "Informe um nome"),
  type: z.enum(["CHECKING", "SAVINGS", "DIGITAL_WALLET", "CASH", "INVESTMENT"]),
  institution: z.string().optional(),
  color: z.string().default("#6366f1"),
  icon: z.string().default("wallet"),
  initialBalance: z.coerce.number().default(0),
});

export type AccountFormState = { error?: string; success?: boolean };

export async function createAccount(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const userId = await requireUserId();
  const parsed = accountSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  await prisma.financialAccount.create({
    data: { ...parsed.data, userId },
  });

  revalidatePath("/contas");
  revalidatePath("/");
  return { success: true };
}

export async function updateAccount(id: string, _prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const userId = await requireUserId();
  const parsed = accountSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const account = await prisma.financialAccount.findFirst({ where: { id, userId } });
  if (!account) return { error: "Conta não encontrada" };

  await prisma.financialAccount.update({ where: { id }, data: parsed.data });

  revalidatePath("/contas");
  revalidatePath("/");
  return { success: true };
}

export async function archiveAccount(id: string) {
  const userId = await requireUserId();
  const account = await prisma.financialAccount.findFirst({ where: { id, userId } });
  if (!account) throw new Error("Conta não encontrada");

  await prisma.financialAccount.update({ where: { id }, data: { archived: true } });
  revalidatePath("/contas");
  revalidatePath("/");
}

const transferSchema = z.object({
  fromAccountId: z.string().min(1),
  toAccountId: z.string().min(1),
  amount: z.coerce.number().positive("Informe um valor válido"),
  date: z.string().min(1),
  description: z.string().optional(),
});

export async function transferBetweenAccounts(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const userId = await requireUserId();
  const parsed = transferSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const { fromAccountId, toAccountId, amount, date, description } = parsed.data;
  if (fromAccountId === toAccountId) return { error: "Escolha contas diferentes" };

  const [from, to] = await Promise.all([
    prisma.financialAccount.findFirst({ where: { id: fromAccountId, userId } }),
    prisma.financialAccount.findFirst({ where: { id: toAccountId, userId } }),
  ]);
  if (!from || !to) return { error: "Conta não encontrada" };

  await prisma.transaction.create({
    data: {
      userId,
      financialAccountId: fromAccountId,
      transferToAccountId: toAccountId,
      kind: "TRANSFER",
      status: "PAID",
      description: description || `Transferência para ${to.name}`,
      amount,
      date: new Date(date),
      paidDate: new Date(date),
      isEssential: false,
    },
  });

  revalidatePath("/contas");
  revalidatePath("/transacoes");
  revalidatePath("/");
  return { success: true };
}
