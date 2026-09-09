"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/server/session";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import { PIN_COOKIE, PIN_COOKIE_MAX_AGE, signPinToken } from "@/lib/pin";
import { deriveShades } from "@/lib/color-shades";

export type RegisterFormState = { error?: string; success?: boolean };

const registerSchema = z
  .object({
    name: z.string().min(1, "Informe seu nome"),
    email: z.string().email("E-mail inválido"),
    password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirme a senha"),
  })
  .refine((d) => d.password === d.confirmPassword, { message: "As senhas não coincidem", path: ["confirmPassword"] });

export async function registerUser(_prev: RegisterFormState, formData: FormData): Promise<RegisterFormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "Já existe uma conta com este e-mail" };

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.flatMap((c) => {
      const rows = [{ userId: user.id, name: c.name, kind: c.kind, icon: c.icon, color: c.color, isDefault: true }];
      return rows;
    }),
  });

  const parents = await prisma.category.findMany({ where: { userId: user.id, isDefault: true } });
  for (const c of DEFAULT_CATEGORIES) {
    if (!c.subcategories?.length) continue;
    const parent = parents.find((p) => p.name === c.name);
    if (!parent) continue;
    const shades = deriveShades(c.color, c.subcategories.length);
    await prisma.category.createMany({
      data: c.subcategories.map((sub, i) => ({
        userId: user.id,
        name: sub.name,
        kind: c.kind,
        icon: sub.icon,
        color: shades[i],
        parentId: parent.id,
        isDefault: true,
      })),
    });
  }

  await prisma.financialAccount.createMany({
    data: [
      {
        userId: user.id,
        name: "Carteira",
        type: "CASH",
        color: "#6366f1",
        icon: "wallet",
        initialBalance: 0,
      },
      {
        userId: user.id,
        name: "Conta bancária",
        type: "CHECKING",
        color: "#2a78d6",
        icon: "landmark",
        initialBalance: 0,
      },
    ],
  });

  return { success: true };
}

export type SettingsFormState = { error?: string; success?: boolean };

const profileSchema = z.object({ name: z.string().min(1, "Informe seu nome") });

export async function updateProfile(_prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  const userId = await requireUserId();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  await prisma.user.update({ where: { id: userId }, data: { name: parsed.data.name } });
  revalidatePath("/configuracoes");
  return { success: true };
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe sua senha atual"),
    newPassword: z.string().min(8, "A nova senha deve ter no mínimo 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { message: "As senhas não coincidem", path: ["confirmPassword"] });

export async function changePassword(_prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  const userId = await requireUserId();
  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.passwordHash) return { error: "Esta conta não usa login por senha" };

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) return { error: "Senha atual incorreta" };

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  return { success: true };
}

const pinSchema = z.object({ pin: z.string().regex(/^\d{4,6}$/, "O PIN deve ter de 4 a 6 dígitos") });

async function setPinCookie(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(PIN_COOKIE, await signPinToken(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PIN_COOKIE_MAX_AGE,
  });
}

export async function updatePin(_prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  const userId = await requireUserId();
  const parsed = pinSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const pinHash = await bcrypt.hash(parsed.data.pin, 10);
  await prisma.user.update({ where: { id: userId }, data: { pinHash } });
  // Quem está definindo o PIN acabou de digitá-lo e já está numa sessão autenticada — considera-se já desbloqueado.
  await setPinCookie(userId);
  revalidatePath("/configuracoes");
  return { success: true };
}

export async function removePin(): Promise<SettingsFormState> {
  const userId = await requireUserId();
  await prisma.user.update({ where: { id: userId }, data: { pinHash: null } });
  const cookieStore = await cookies();
  cookieStore.delete(PIN_COOKIE);
  revalidatePath("/configuracoes");
  return { success: true };
}

const verifyPinSchema = z.object({ pin: z.string().min(1, "Informe o PIN") });

export type VerifyPinState = { error?: string; success?: boolean };

export async function verifyPin(_prev: VerifyPinState, formData: FormData): Promise<VerifyPinState> {
  const userId = await requireUserId();
  const parsed = verifyPinSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Informe o PIN" };

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { pinHash: true } });
  if (!user?.pinHash) return { success: true };

  const valid = await bcrypt.compare(parsed.data.pin, user.pinHash);
  if (!valid) return { error: "PIN incorreto" };

  await setPinCookie(userId);
  return { success: true };
}
