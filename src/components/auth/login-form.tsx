"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function LoginForm({
  googleEnabled,
  appleEnabled,
  microsoftEnabled,
}: {
  googleEnabled: boolean;
  appleEnabled: boolean;
  microsoftEnabled: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirect: false,
      });
      if (result?.error) {
        setError("E-mail ou senha inválidos.");
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>Acesse sua vida financeira em um só lugar.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" placeholder="voce@exemplo.com" required autoComplete="email" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Link href="/esqueci-senha" className="text-xs font-medium text-primary hover:underline">
                Esqueceu a senha?
              </Link>
            </div>
            <PasswordInput id="password" name="password" required autoComplete="current-password" />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        {(googleEnabled || appleEnabled || microsoftEnabled) && (
          <>
            <div className="relative py-2 text-center text-xs text-muted-foreground">
              <span className="bg-card px-2">ou continue com</span>
              <div className="absolute inset-x-0 top-1/2 -z-10 h-px bg-border" />
            </div>
            <div className="space-y-2">
              {googleEnabled && (
                <Button variant="outline" className="w-full" onClick={() => signIn("google", { callbackUrl })}>
                  Google
                </Button>
              )}
              {appleEnabled && (
                <Button variant="outline" className="w-full" onClick={() => signIn("apple", { callbackUrl })}>
                  Apple
                </Button>
              )}
              {microsoftEnabled && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => signIn("microsoft-entra-id", { callbackUrl })}
                >
                  Microsoft
                </Button>
              )}
            </div>
          </>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Não tem uma conta?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Criar conta
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
