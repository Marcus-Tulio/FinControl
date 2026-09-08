"use server";

import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

async function currentOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("host");
  const protocol = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export type RequestResetState = { error?: string; success?: boolean };

const requestResetSchema = z.object({ email: z.string().email("E-mail inválido") });

export async function requestPasswordReset(_prev: RequestResetState, formData: FormData): Promise<RequestResetState> {
  const parsed = requestResetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email }, select: { passwordHash: true } });

  // Não revela se o e-mail existe ou não (evita enumeração de contas) — sempre retorna sucesso.
  if (user?.passwordHash) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });
    await prisma.verificationToken.create({
      data: { identifier: email, token: hashToken(rawToken), expires: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
    });

    const origin = await currentOrigin();
    const resetUrl = `${origin}/redefinir-senha?token=${rawToken}&email=${encodeURIComponent(email)}`;

    try {
      await sendPasswordResetEmail(email, resetUrl);
    } catch (err) {
      console.error("Falha ao enviar e-mail de redefinição de senha:", err);
      return { error: "Não foi possível enviar o e-mail agora. Tente novamente em instantes." };
    }
  }

  return { success: true };
}

export type ResetPasswordState = { error?: string; success?: boolean };

const resetPasswordSchema = z
  .object({
    email: z.string().email(),
    token: z.string().min(1),
    newPassword: z.string().min(8, "A nova senha deve ter no mínimo 8 caracteres"),
    confirmPassword: z.string().min(1),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { message: "As senhas não coincidem", path: ["confirmPassword"] });

export async function resetPassword(_prev: ResetPasswordState, formData: FormData): Promise<ResetPasswordState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const { email, token, newPassword } = parsed.data;
  const identifier = email.toLowerCase();
  const hashedToken = hashToken(token);

  const verification = await prisma.verificationToken.findUnique({
    where: { token: hashedToken },
  });

  if (!verification || verification.identifier !== identifier || verification.expires < new Date()) {
    return { error: "Link inválido ou expirado. Solicite uma nova redefinição de senha." };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { email: identifier }, data: { passwordHash } });
  await prisma.verificationToken.deleteMany({ where: { identifier } });

  return { success: true };
}
