"use client";

import { useActionState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { verifyPin, type VerifyPinState } from "@/server/actions/auth";

const emptyState: VerifyPinState = {};

export function UnlockForm({ name }: { name?: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [state, formAction, isPending] = useActionState(verifyPin, emptyState);

  useEffect(() => {
    if (state.success) {
      router.push(callbackUrl);
      router.refresh();
    }
  }, [state.success]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Digite seu PIN</CardTitle>
        <CardDescription>{name ? `Olá, ${name}. ` : ""}Confirme o PIN para continuar.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pin">PIN</Label>
            <Input
              id="pin"
              name="pin"
              type="password"
              inputMode="numeric"
              pattern="\d{4,6}"
              maxLength={6}
              autoFocus
              required
              placeholder="****"
              className="text-center text-lg tracking-[0.5em]"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Verificando..." : "Desbloquear"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
