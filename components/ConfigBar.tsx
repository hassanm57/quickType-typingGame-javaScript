"use client";
import type { TestConfig, TestMode } from "@/lib/engine/useTypingTest";

interface Props {
  config: TestConfig;
  onChange: (c: TestConfig) => void;
}

const MODES: { id: TestMode; label: string; icon: string }[] = [
  { id: "time", label: "time", icon: "⏱" },
  { id: "words", label: "words", icon: "A" },
  { id: "zen", label: "zen", icon: "◎" },
  { id: "survival", label: "survival", icon: "♻" },
  { id: "sudden-death", label: "sudden death", icon: "☠" },
];

const SUB_OPTIONS: Partial<Record<TestMode, number[]>> = {
  time: [15, 30, 60, 120],
  words: [10, 25, 50, 100],
};

export default function ConfigBar({ config, onChange }: Props) {
  const subOpts = SUB_OPTIONS[config.mode];

  return (
    <div className="config-bar">
      <div className="config-group">
        {MODES.map((m) => (
          <button
            key={m.id}
            className={`config-btn ${config.mode === m.id ? "config-btn-active" : ""}`}
            onClick={() => {
              const defaults: Record<TestMode, number> = {
                time: 30,
                words: 25,
                zen: 0,
                survival: 30,
                "sudden-death": 0,
              };
              onChange({ mode: m.id, amount: defaults[m.id] });
            }}
          >
            <span className="config-btn-icon">{m.icon}</span>
            {m.label}
          </button>
        ))}
      </div>

      {subOpts && subOpts.length > 0 && (
        <>
          <div className="config-sep" />
          <div className="config-group">
            {subOpts.map((n) => (
              <button
                key={n}
                className={`config-btn ${config.amount === n ? "config-btn-active" : ""}`}
                onClick={() => onChange({ ...config, amount: n })}
              >
                {n}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
