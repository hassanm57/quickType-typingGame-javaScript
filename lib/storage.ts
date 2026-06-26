import { DEFAULT_THEME } from "./themes";
import type { TestConfig } from "./engine/useTypingTest";
import type { TestStats } from "./engine/wpm";

export interface Settings {
  theme: string;
  soundEnabled: boolean;
  smoothCaret: boolean;
}

const DEFAULTS: Settings = {
  theme: DEFAULT_THEME,
  soundEnabled: false,
  smoothCaret: true,
};

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem("qt:settings");
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function saveSettings(s: Settings): void {
  localStorage.setItem("qt:settings", JSON.stringify(s));
}

function pbKey(config: TestConfig): string {
  return `qt:pb:${config.mode}:${config.amount}`;
}

export interface PersonalBest {
  wpm: number;
  accuracy: number;
  raw: number;
  date: string;
}

export function loadPB(config: TestConfig): PersonalBest | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(pbKey(config));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function checkAndSavePB(config: TestConfig, stats: TestStats): boolean {
  const current = loadPB(config);
  if (!current || stats.wpm > current.wpm) {
    const pb: PersonalBest = {
      wpm: stats.wpm,
      accuracy: stats.accuracy,
      raw: stats.raw,
      date: new Date().toISOString(),
    };
    localStorage.setItem(pbKey(config), JSON.stringify(pb));
    return true;
  }
  return false;
}
