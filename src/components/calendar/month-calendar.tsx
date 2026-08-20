"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency, formatDateLong } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TransactionKind } from "@prisma/client";

export type CalendarEvent = {
  id: string;
  description: string;
  amount: number;
  kind: TransactionKind;
  status: string;
  date: string;
};

const KIND_DOT: Record<string, string> = {
  INCOME: "bg-[var(--status-good)]",
  EXPENSE: "bg-destructive",
  INVESTMENT: "bg-primary",
  TRANSFER: "bg-muted-foreground",
  ADJUSTMENT: "bg-muted-foreground",
};

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function MonthCalendar({
  weeks,
  eventsByDay,
  currentMonth,
}: {
  weeks: (string | null)[][];
  eventsByDay: Record<string, CalendarEvent[]>;
  currentMonth: number;
}) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-muted-foreground">
        {WEEKDAYS.map((d) => <div key={d} className="py-1">{d}</div>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-2">
        {weeks.flat().map((dateKey, i) => {
          if (!dateKey) return <div key={i} className="aspect-square" />;
          const events = eventsByDay[dateKey] ?? [];
          const dayNum = Number(dateKey.slice(-2));
          const isToday = dateKey === today;
          const isOtherMonth = Number(dateKey.slice(5, 7)) !== currentMonth;

          return (
            <button
              key={dateKey}
              onClick={() => events.length > 0 && setSelectedDay(dateKey)}
              className={cn(
                "flex aspect-square flex-col items-start gap-1 rounded-lg border border-transparent p-1.5 text-left transition-colors",
                isOtherMonth && "opacity-40",
                events.length > 0 && "cursor-pointer hover:border-border hover:bg-accent",
                isToday && "border-primary bg-primary/5"
              )}
            >
              <span className={cn("text-xs font-medium", isToday && "flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground")}>
                {dayNum}
              </span>
              <div className="flex flex-wrap gap-0.5">
                {events.slice(0, 4).map((e) => (
                  <span key={e.id} className={cn("h-1.5 w-1.5 rounded-full", KIND_DOT[e.kind])} />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <Dialog open={Boolean(selectedDay)} onOpenChange={(o) => !o && setSelectedDay(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{selectedDay && formatDateLong(new Date(selectedDay + "T12:00:00"))}</DialogTitle>
          </DialogHeader>
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {selectedDay && (eventsByDay[selectedDay] ?? []).map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", KIND_DOT[e.kind])} />
                  <span className="truncate text-sm">{e.description}</span>
                </div>
                <span className="shrink-0 text-sm font-medium tabular-nums">{formatCurrency(e.amount)}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
