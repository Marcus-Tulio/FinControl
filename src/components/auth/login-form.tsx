"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getProfileTypesForEmail } from "@/server/actions/auth";

type ProfileType = "PERSONAL" | "BUSINESS";

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
  const [isChecking, startCheckTransition] = useTransition();

  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const [availableTypes, setAvailableTypes] = useState<ProfileType[]>([]);
  const [profileType, setProfileType] = useState<ProfileType>("PERSONAL");

  function handleContinue(formData: FormData) {
    setError(null);
    const typedEmail = String(formData.get("email") ?? "").trim();
    startCheckTransition(async () => {
      const types = await getProfileTypesForEmail(typedEmail);
      setEmail(typedEmail);
      setAvailableTypes(types);
      if (types.length >= 1) setProfileType(types[0]);
      setStep("password");
    });
  }

  function handleBack() {
    setStep("email");
    setError(null);
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await signIn("credentials", {
        email,
        password: formData.get("password"),
        profileType,
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
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === "email" ? (
          <form action={handleContinue} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="voce@exemplo.com"
                required
                autoComplete="email"
                defaultValue={email}
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full" disabled={isChecking}>
              {isChecking ? "Verificando..." : "Continuar"}
            </Button>
          </form>
        ) : (
          <form action={handleSubmit} className="space-y-4">
            <button
              type="button"
              onClick={handleBack}
              className="text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              {email} · trocar
            </button>

            {availableTypes.length > 1 && (
              <div className="space-y-2">
                <Label>Conectar como</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={profileType === "PERSONAL" ? "default" : "outline"}
                    onClick={() => setProfileType("PERSONAL")}
                  >
                    Individual
                  </Button>
                  <Button
                    type="button"
                    variant={profileType === "BUSINESS" ? "default" : "outline"}
                    onClick={() => setProfileType("BUSINESS")}
                  >
                    Empresa
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link href="/esqueci-senha" className="text-xs font-medium text-primary hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>
              <PasswordInput id="password" name="password" required autoComplete="current-password" autoFocus />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        )}

        {step === "email" && (googleEnabled || appleEnabled || microsoftEnabled) && (
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
