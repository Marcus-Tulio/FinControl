"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { requestPasswordReset, type RequestResetState } from "@/server/actions/password-reset";

const emptyState: RequestResetState = {};

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(requestPasswordReset, emptyState);

  if (state.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verifique seu e-mail</CardTitle>
          <CardDescription>
            Se existir uma conta com esse e-mail, enviamos um link para redefinir sua senha. Confira também a caixa de spam.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login" className="text-sm font-medium text-primary hover:underline">
            Voltar para o login
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Esqueceu sua senha?</CardTitle>
        <CardDescription>Informe seu e-mail e enviaremos um link para redefinir sua senha.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" placeholder="voce@exemplo.com" required autoComplete="email" />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Enviando..." : "Enviar link de redefinição"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Voltar para o login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
