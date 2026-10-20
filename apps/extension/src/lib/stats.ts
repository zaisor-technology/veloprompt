import type { DataType } from "veloprompt-core";

export interface WeeklyStats {
  /** Semana ISO, p. ej. "2026-W43". */
  week: string;
  byType: Partial<Record<DataType, number>>;
}

/** Semana ISO 8601 (lunes a domingo) en hora local. */
export function isoWeek(date: Date): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = (d.getDay() + 6) % 7; // lunes = 0
  d.setDate(d.getDate() - day + 3); // jueves de esa semana
  const year = d.getFullYear();
  const firstThursday = new Date(year, 0, 4);
  const firstDay = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstDay + 3);
  const week = 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000));
  return `${year}-W${String(week).padStart(2, "0")}`;
}

/** Devuelve las estadísticas de la semana actual (vacías si las guardadas son de otra semana). */
export function currentWeek(stored: unknown, now = new Date()): WeeklyStats {
  const week = isoWeek(now);
  const s = stored as WeeklyStats | undefined;
  return s && s.week === week && s.byType && typeof s.byType === "object" ? s : { week, byType: {} };
}

export function addToStats(stats: WeeklyStats, types: readonly DataType[]): WeeklyStats {
  const byType = { ...stats.byType };
  for (const t of types) byType[t] = (byType[t] ?? 0) + 1;
  return { week: stats.week, byType };
}

export function total(stats: WeeklyStats): number {
  return Object.values(stats.byType).reduce((a, b) => a + (b ?? 0), 0);
}
