"use client";
import { useCallback, useState } from "react";
import useTypingTest, { type TestConfig } from "@/lib/engine/useTypingTest";
import { useSettings } from "@/lib/useSettings";
import ConfigBar from "@/components/ConfigBar";
import TestArea from "@/components/TestArea/TestArea";
import Results from "@/components/Results/Results";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import LoadingScreen from "@/components/LoadingScreen";

const DEFAULT_CONFIG: TestConfig = { mode: "time", amount: 30 };

export default function Home() {
  const [config, setConfig] = useState<TestConfig>(DEFAULT_CONFIG);
  const { settings, hydrated, handleSettingsChange } = useSettings();
  const [showLoading, setShowLoading] = useState(true);

  const test = useTypingTest(config);

  const handleConfigChange = useCallback((c: TestConfig) => {
    setConfig(c);
  }, []);

  return (
    <>
      {showLoading && (
        <LoadingScreen onComplete={() => setShowLoading(false)} />
      )}

      {hydrated && (
        <div className="app">
          <Header settings={settings} onSettingsChange={handleSettingsChange} />

          <HeroSection />

          <section id="test" className="test-section">
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
          </section>

          <Footer theme={settings.theme} />
        </div>
      )}
    </>
  );
}
