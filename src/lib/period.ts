import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  subMonths,
  addDays,
} from "date-fns";

export type PeriodKey = "today" | "week" | "month" | "quarter" | "semester" | "year";

export const PERIOD_LABELS: Record<PeriodKey, string> = {
  today: "Hoje",
  week: "Semana",
  month: "Mês",
  quarter: "Trimestre",
  semester: "Semestre",
  year: "Ano",
};

export function getPeriodRange(period: PeriodKey, reference: Date = new Date()): { start: Date; end: Date } {
  switch (period) {
    case "today":
      return { start: startOfDay(reference), end: endOfDay(reference) };
    case "week":
      return { start: startOfWeek(reference, { weekStartsOn: 0 }), end: endOfWeek(reference, { weekStartsOn: 0 }) };
    case "month":
      return { start: startOfMonth(reference), end: endOfMonth(reference) };
    case "quarter":
      return { start: startOfQuarter(reference), end: endOfQuarter(reference) };
    case "semester": {
      const half = reference.getMonth() < 6 ? 0 : 6;
      const start = new Date(reference.getFullYear(), half, 1);
      const end = endOfMonth(new Date(reference.getFullYear(), half + 5, 1));
      return { start, end };
    }
    case "year":
      return { start: startOfYear(reference), end: endOfYear(reference) };
  }
}

export function getPreviousPeriodRange(period: PeriodKey, reference: Date = new Date()): { start: Date; end: Date } {
  const { start } = getPeriodRange(period, reference);
  const dayBefore = addDays(start, -1);
  return getPeriodRange(period, dayBefore);
}

export function lastNMonths(n: number, reference: Date = new Date()): { start: Date; end: Date; label: string }[] {
  const months: { start: Date; end: Date; label: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const ref = subMonths(reference, i);
    months.push({
      start: startOfMonth(ref),
      end: endOfMonth(ref),
      label: new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(ref).replace(".", ""),
    });
  }
  return months;
}
