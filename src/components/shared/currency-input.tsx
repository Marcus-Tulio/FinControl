"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function centsToDisplay(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function toInitialCents(value?: number | string | null): number {
  if (!value) return 0;
  return Math.round(Math.abs(Number(value)) * 100);
}

/** Input de valor monetário: digita-se os dígitos direto (da direita pra esquerda, como caixa eletrônico) e a máscara R$ 0,00 é aplicada em tempo real. */
export function CurrencyInput({
  name,
  defaultValue,
  required,
  autoFocus,
  className,
  allowNegative = false,
}: {
  name: string;
  defaultValue?: number | string | null;
  required?: boolean;
  autoFocus?: boolean;
  className?: string;
  allowNegative?: boolean;
}) {
  const [cents, setCents] = useState(() => toInitialCents(defaultValue));
  const [negative, setNegative] = useState(() => Number(defaultValue ?? 0) < 0);
  const display = cents === 0 ? "" : centsToDisplay(cents);
  const signedValue = ((negative ? -1 : 1) * cents / 100).toFixed(2);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "");
    setCents(digits ? Number(digits) : 0);
  }

  return (
    <div className="flex items-stretch gap-1.5">
      {allowNegative && (
        <button
          type="button"
          onClick={() => setNegative((n) => !n)}
          className="w-8 shrink-0 rounded-lg border border-input text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
          aria-label={negative ? "Valor negativo" : "Valor positivo"}
          title={negative ? "Valor negativo (clique para alternar)" : "Valor positivo (clique para alternar)"}
        >
          {negative ? "−" : "+"}
        </button>
      )}
      <div className="relative flex-1">
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
        <Input
          inputMode="decimal"
          placeholder="0,00"
          value={display}
          onChange={handleChange}
          required={required}
          autoFocus={autoFocus}
          className={cn("pl-8 tabular-nums", className)}
        />
      </div>
      <input type="hidden" name={name} value={signedValue} />
    </div>
  );
}
