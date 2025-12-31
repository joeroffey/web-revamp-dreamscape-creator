import { endOfDay, endOfMonth, startOfDay, startOfMonth, subDays } from "date-fns";

export type AdminDateRangeKey = "7days" | "30days" | "90days" | "thisMonth" | "lastMonth";

export function getDateRange(key: AdminDateRangeKey): { from: Date; to: Date } {
  const now = new Date();

  switch (key) {
    case "7days":
      return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) };
    case "30days":
      return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) };
    case "90days":
      return { from: startOfDay(subDays(now, 89)), to: endOfDay(now) };
    case "thisMonth":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "lastMonth": {
      const lastMonthEnd = subDays(startOfMonth(now), 1);
      return { from: startOfMonth(lastMonthEnd), to: endOfMonth(lastMonthEnd) };
    }
    default:
      return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) };
  }
}
