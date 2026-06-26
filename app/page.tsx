"use client";
import { useCallback, useEffect, useState } from "react";
import useTypingTest, { type TestConfig } from "@/lib/engine/useTypingTest";
import { loadSettings, saveSettings, type Settings } from "@/lib/storage";
import { applyTheme } from "@/lib/themes";
import { setSoundEnabled } from "@/lib/sound";
import ConfigBar from "@/components/ConfigBar";
import TestArea from "@/components/TestArea/TestArea";
import Results from "@/components/Results/Results";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const DEFAULT_CONFIG: TestConfig = { mode: "time", amount: 30 };

export default function Home() {
  const [config, setConfig] = useState<TestConfig>(DEFAULT_CONFIG);
  const [settings, setSettings] = useState<Settings>({
    theme: "ember",
    soundEnabled: false,
    smoothCaret: true,
  });
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

  const test = useTypingTest(config);

  const handleConfigChange = useCallback((c: TestConfig) => {
    setConfig(c);
  }, []);

  if (!hydrated) return null;

  return (
    <div className="app">
      <Header settings={settings} onSettingsChange={handleSettingsChange} />
      <main className="main">
        <ConfigBar config={config} onChange={handleConfigChange} />
        {test.status !== "finished" ? (
          <TestArea {...test} soundEnabled={settings.soundEnabled} config={config} />
        ) : (
          <Results
            stats={test.finalStats!}
            samples={test.wpmSamples}
            config={config}
            onRestart={test.restart}
            soundEnabled={settings.soundEnabled}
          />
        )}
      </main>
      <Footer theme={settings.theme} />
    </div>
  );
}
