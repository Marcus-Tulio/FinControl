import "server-only";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = process.env.EMAIL_FROM || "FinControl <onboarding@resend.dev>";

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (!resend) {
    throw new Error("RESEND_API_KEY não configurado — não é possível enviar e-mails.");
  }

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Redefinir sua senha — FinControl",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #0d2b22;">Redefinir senha</h2>
        <p>Recebemos um pedido para redefinir a senha da sua conta FinControl.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;background:#1f9d6f;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;">
            Redefinir senha
          </a>
        </p>
        <p style="color:#666;font-size:13px;">Este link expira em 1 hora. Se você não pediu essa redefinição, ignore este e-mail.</p>
      </div>
    `,
  });
}
