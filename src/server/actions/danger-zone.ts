"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/server/session";
import { seedDefaultData } from "@/server/seed-defaults";
import { revalidateEverything } from "@/server/revalidate";

export type DangerZoneState = { error?: string; success?: boolean };

/** Se a conta usa senha, exige e valida a senha atual; contas só com login social não têm o que verificar. */
async function checkCurrentPassword(userId: string, currentPassword: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  if (!user?.passwordHash) return null;
  const valid = await bcrypt.compare(currentPassword ?? "", user.passwordHash);
  return valid ? null : "Senha atual incorreta";
}

const resetSchema = z.object({
  confirmText: z.string().refine((v) => v === "REINICIAR", { message: 'Digite "REINICIAR" para confirmar' }),
  currentPassword: z.string().optional(),
});

export async function resetAccountData(_prev: DangerZoneState, formData: FormData): Promise<DangerZoneState> {
  const userId = await requireUserId();
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const passwordError = await checkCurrentPassword(userId, parsed.data.currentPassword ?? "");
  if (passwordError) return { error: passwordError };

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { profileType: true } });

  await prisma.$transaction([
    prisma.transaction.deleteMany({ where: { userId } }),
    prisma.recurringRule.deleteMany({ where: { userId } }),
    prisma.budget.deleteMany({ where: { userId } }),
    prisma.goal.deleteMany({ where: { userId } }),
    prisma.debt.deleteMany({ where: { userId } }),
    prisma.investment.deleteMany({ where: { userId } }),
    prisma.notification.deleteMany({ where: { userId } }),
    prisma.financialAccount.deleteMany({ where: { userId } }),
    prisma.category.deleteMany({ where: { userId } }),
  ]);

  await seedDefaultData(userId, user.profileType);

  revalidateEverything();
  return { success: true };
}

const deleteAccountSchema = z.object({
  confirmText: z.string().refine((v) => v === "EXCLUIR", { message: 'Digite "EXCLUIR" para confirmar' }),
  currentPassword: z.string().optional(),
});

export async function deleteUserAccount(_prev: DangerZoneState, formData: FormData): Promise<DangerZoneState> {
  const userId = await requireUserId();
  const parsed = deleteAccountSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const passwordError = await checkCurrentPassword(userId, parsed.data.currentPassword ?? "");
  if (passwordError) return { error: passwordError };

  // Cascata do schema remove automaticamente todas as transações, contas, categorias, metas, dívidas, investimentos etc.
  await prisma.user.delete({ where: { id: userId } });

  return { success: true };
}
