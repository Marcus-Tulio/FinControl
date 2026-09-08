"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { resetPassword, type ResetPasswordState } from "@/server/actions/password-reset";

const emptyState: ResetPasswordState = {};

export function ResetPasswordForm({ email, token }: { email: string; token: string }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(resetPassword, emptyState);

  useEffect(() => {
    if (state.success) {
      toast.success("Senha redefinida com sucesso");
      router.push("/login");
    }
  }, [state.success, router]);

  if (!email || !token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Link inválido</CardTitle>
          <CardDescription>Este link de redefinição de senha está incompleto ou expirou.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/esqueci-senha" className="text-sm font-medium text-primary hover:underline">
            Solicitar novo link
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar nova senha</CardTitle>
        <CardDescription>Escolha uma nova senha para sua conta.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="token" value={token} />
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova senha</Label>
            <Input id="newPassword" name="newPassword" type="password" required minLength={8} autoComplete="new-password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Salvando..." : "Redefinir senha"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
