import { addDays, addWeeks, addMonths, addYears } from "date-fns";
import type { RecurrenceFrequency } from "@prisma/client";

export function addByFrequency(date: Date, frequency: RecurrenceFrequency, interval: number): Date {
  switch (frequency) {
    case "DAILY":
      return addDays(date, interval);
    case "WEEKLY":
      return addWeeks(date, interval);
    case "MONTHLY":
      return addMonths(date, interval);
    case "YEARLY":
      return addYears(date, interval);
  }
}

export function generateOccurrences(
  startDate: Date,
  frequency: RecurrenceFrequency,
  interval: number,
  count: number,
  endDate?: Date | null
): Date[] {
  const dates: Date[] = [];
  let current = startDate;
  for (let i = 0; i < count; i++) {
    if (endDate && current > endDate) break;
    dates.push(current);
    current = addByFrequency(current, frequency, interval);
  }
  return dates;
}
