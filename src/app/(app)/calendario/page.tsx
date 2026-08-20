import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requireUserId } from "@/server/session";
import { getCalendarEvents } from "@/server/queries/transactions";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { MonthCalendar, type CalendarEvent } from "@/components/calendar/month-calendar";
import { formatMonthYear } from "@/lib/format";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const userId = await requireUserId();
  const sp = await searchParams;

  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1;
  if (sp.month && /^\d{4}-\d{2}$/.test(sp.month)) {
    [year, month] = sp.month.split("-").map(Number);
  }

  const reference = new Date(year, month - 1, 1);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const firstWeekday = start.getDay();
  const daysInMonth = end.getDate();
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

  const days: (string | null)[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - firstWeekday + 1;
    if (dayNum < 1 || dayNum > daysInMonth) {
      days.push(null);
    } else {
      days.push(`${year}-${pad(month)}-${pad(dayNum)}`);
    }
  }
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  const gridStart = new Date(year, month - 1, 1 - firstWeekday);
  const gridEnd = new Date(year, month - 1, daysInMonth + (totalCells - firstWeekday - daysInMonth));

  const events = await getCalendarEvents(userId, gridStart, gridEnd);

  const eventsByDay: Record<string, CalendarEvent[]> = {};
  for (const tx of events) {
    const key = (tx.dueDate ?? tx.date).toISOString().slice(0, 10);
    if (!eventsByDay[key]) eventsByDay[key] = [];
    eventsByDay[key].push({
      id: tx.id,
      description: tx.description,
      amount: Number(tx.amount),
      kind: tx.kind,
      status: tx.status,
      date: key,
    });
  }

  const prevMonth = new Date(year, month - 2, 1);
  const nextMonth = new Date(year, month, 1);

  return (
    <div>
      <PageHeader
        title="Calendário financeiro"
        description="Receitas, despesas, faturas, parcelas e investimentos em um só calendário."
        actions={
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" nativeButton={false} render={<Link href={`/calendario?month=${prevMonth.getFullYear()}-${pad(prevMonth.getMonth() + 1)}`} />}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[140px] text-center text-sm font-medium">{formatMonthYear(reference)}</span>
            <Button variant="outline" size="icon" nativeButton={false} render={<Link href={`/calendario?month=${nextMonth.getFullYear()}-${pad(nextMonth.getMonth() + 1)}`} />}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <div className="rounded-2xl border border-border bg-card p-4">
        <MonthCalendar weeks={weeks} eventsByDay={eventsByDay} currentMonth={month} />
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[var(--status-good)]" /> Receitas</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-destructive" /> Despesas</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Investimentos</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-muted-foreground" /> Transferências/Ajustes</span>
      </div>
    </div>
  );
}
