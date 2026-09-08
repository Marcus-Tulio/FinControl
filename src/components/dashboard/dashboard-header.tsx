"use client";

import { Plus } from "lucide-react";
import { PeriodSelector } from "@/components/shared/period-selector";
import { QuickAddTrigger } from "@/components/layout/quick-add";
import type { PeriodKey } from "@/lib/period";

export function DashboardHeader({
  monthLabel,
  greetingName,
  period,
}: {
  monthLabel: string;
  greetingName: string;
  period: PeriodKey;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">{monthLabel}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Olá, {greetingName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sua vida financeira em um só lugar.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <PeriodSelector current={period} />
        <QuickAddTrigger className="rounded-full">
          <Plus className="h-4 w-4" /> Nova transação
        </QuickAddTrigger>
      </div>
    </div>
  );
}
