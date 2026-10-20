import { browser } from "wxt/browser";
import type { DataType } from "veloprompt-core";
import { sanitizeSettings, type Settings } from "./settings";
import { addToStats, currentWeek, type WeeklyStats } from "./stats";

// Todo en chrome.storage.local: nada se sincroniza ni sale del equipo.
// El mapa etiqueta → valor NUNCA se guarda aquí; vive solo en memoria de la pestaña.

export async function loadSettings(): Promise<Settings> {
  const { settings } = await browser.storage.local.get("settings");
  return sanitizeSettings(settings);
}

export async function saveSettings(settings: Settings): Promise<void> {
  await browser.storage.local.set({ settings: sanitizeSettings(settings) });
}

export function watchSettings(cb: (s: Settings) => void): () => void {
  const listener = (changes: Record<string, { newValue?: unknown }>, area: string) => {
    if (area === "local" && changes.settings) cb(sanitizeSettings(changes.settings.newValue));
  };
  browser.storage.onChanged.addListener(listener);
  return () => browser.storage.onChanged.removeListener(listener);
}

export async function loadStats(): Promise<WeeklyStats> {
  const { stats } = await browser.storage.local.get("stats");
  return currentWeek(stats);
}

export async function recordAvoided(types: readonly DataType[]): Promise<void> {
  if (types.length === 0) return;
  const stats = await loadStats();
  await browser.storage.local.set({ stats: addToStats(stats, types) });
}

export async function resetStats(): Promise<void> {
  await browser.storage.local.remove("stats");
}

export function watchStats(cb: (s: WeeklyStats) => void): () => void {
  const listener = (changes: Record<string, { newValue?: unknown }>, area: string) => {
    if (area === "local" && changes.stats) cb(currentWeek(changes.stats.newValue));
  };
  browser.storage.onChanged.addListener(listener);
  return () => browser.storage.onChanged.removeListener(listener);
}
