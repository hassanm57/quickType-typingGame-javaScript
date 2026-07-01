"use client";
import { useEffect, useState } from "react";
import type { Settings } from "@/lib/storage";
import { THEMES } from "@/lib/themes";

interface Props {
  settings: Settings;
  onSettingsChange: (s: Settings) => void;
}

export default function Header({ settings, onSettingsChange }: Props) {
  const [showSettings, setShowSettings] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [soundIconKey, setSoundIconKey] = useState(0);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header className={`site-header${scrolled ? " site-header-scrolled" : ""}`}>
      <div className="logo">
        <span className="logo-quick">quick</span>
        <span className="logo-type">Type</span>
        <span className="logo-bang">!</span>
      </div>

      <nav className="header-nav">
        <button
          className="icon-btn sound-btn"
          title={settings.soundEnabled ? "Mute sound" : "Unmute sound"}
          onClick={() => {
            onSettingsChange({ ...settings, soundEnabled: !settings.soundEnabled });
            setSoundIconKey((k) => k + 1);
          }}
          aria-label="Toggle sound"
        >
          <span key={soundIconKey} className="sound-icon">
            {settings.soundEnabled ? "🔊" : "🔇"}
          </span>
        </button>
        <button
          className="icon-btn"
          title="Settings"
          onClick={() => setShowSettings((v) => !v)}
          aria-label="Settings"
        >
          ⚙
        </button>
      </nav>

      {showSettings && (
        <div className="settings-panel" role="dialog" aria-label="Settings">
          <button className="settings-close" onClick={() => setShowSettings(false)}>✕</button>
          <h3 className="settings-title">settings</h3>

          <div className="settings-row">
            <span className="settings-label">sound</span>
            <button
              className={`toggle-btn ${settings.soundEnabled ? "toggle-on" : ""}`}
              onClick={() => onSettingsChange({ ...settings, soundEnabled: !settings.soundEnabled })}
            >
              {settings.soundEnabled ? "on" : "off"}
            </button>
          </div>

          <div className="settings-section-label">theme</div>
          <div className="theme-grid">
            {THEMES.map((t) => (
              <button
                key={t.name}
                className={`theme-swatch ${settings.theme === t.name ? "theme-swatch-active" : ""}`}
                style={{ "--swatch-accent": t.vars["--accent"], "--swatch-bg": t.vars["--bg"] } as React.CSSProperties}
                onClick={() => onSettingsChange({ ...settings, theme: t.name })}
                title={t.label}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
