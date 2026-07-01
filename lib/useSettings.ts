"use client";
import { useCallback, useEffect, useState } from "react";
import { loadSettings, saveSettings, type Settings } from "@/lib/storage";
import { applyTheme } from "@/lib/themes";
import { setSoundEnabled } from "@/lib/sound";

const INITIAL_SETTINGS: Settings = {
  theme: "ember",
  soundEnabled: true,
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(INITIAL_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    applyTheme(s.theme);
    setSoundEnabled(s.soundEnabled);
    setHydrated(true);
  }, []);

  const handleSettingsChange = useCallback((s: Settings) => {
    setSettings(s);
    saveSettings(s);
    applyTheme(s.theme);
    setSoundEnabled(s.soundEnabled);
  }, []);

  return { settings, hydrated, handleSettingsChange };
}
