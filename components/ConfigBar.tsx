"use client";
import type { TestConfig, TestMode } from "@/lib/engine/useTypingTest";

interface Props {
  config: TestConfig;
  onChange: (c: TestConfig) => void;
}

const IconTime = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
    <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
    <line x1="6.5" y1="3" x2="6.5" y2="7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="6.5" y1="7" x2="9" y2="8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const IconWords = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
    <line x1="1.5" y1="3" x2="11.5" y2="3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="1.5" y1="6.5" x2="8.5" y2="6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="1.5" y1="10" x2="6" y2="10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const IconZen = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
    <path d="M2 6.5C2 6.5 4 3.5 6.5 3.5C9 3.5 11 6.5 11 6.5C11 6.5 9 9.5 6.5 9.5C4 9.5 2 6.5 2 6.5Z" stroke="currentColor" strokeWidth="1.3"/>
    <circle cx="6.5" cy="6.5" r="1.5" fill="currentColor"/>
  </svg>
);

const IconSurvival = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
    <path d="M6.5 11C6.5 11 2 8 2 5C2 3.343 3.343 2 5 2C5.9 2 6.7 2.4 7.2 3C7.2 3 7.5 2 9 2C10.105 2 11 2.895 11 4C11 7 6.5 11 6.5 11Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
  </svg>
);

const IconDeath = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
    <path d="M6.5 2C4.015 2 2 4.015 2 6.5C2 8.3 3.05 9.85 4.55 10.65L4.55 11.5H8.45L8.45 10.65C9.95 9.85 11 8.3 11 6.5C11 4.015 8.985 2 6.5 2Z" stroke="currentColor" strokeWidth="1.3"/>
    <circle cx="4.8" cy="6.5" r="0.9" fill="currentColor"/>
    <circle cx="8.2" cy="6.5" r="0.9" fill="currentColor"/>
  </svg>
);

const IconPractice = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
    <circle cx="6.5" cy="6.5" r="4.7" stroke="currentColor" strokeWidth="1.3"/>
    <circle cx="6.5" cy="6.5" r="2.3" stroke="currentColor" strokeWidth="1.3"/>
    <circle cx="6.5" cy="6.5" r="0.7" fill="currentColor"/>
  </svg>
);

const MODE_ICONS: Record<TestMode, React.ReactNode> = {
  time: <IconTime />,
  words: <IconWords />,
  zen: <IconZen />,
  survival: <IconSurvival />,
  "sudden-death": <IconDeath />,
  practice: <IconPractice />,
};

const MODES: { id: TestMode; label: string }[] = [
  { id: "time", label: "time" },
  { id: "words", label: "words" },
  { id: "practice", label: "practice" },
  { id: "zen", label: "zen" },
  { id: "survival", label: "survival" },
  { id: "sudden-death", label: "sudden death" },
];

const SUB_OPTIONS: Partial<Record<TestMode, number[]>> = {
  time: [15, 30, 60, 120],
  words: [10, 25, 50, 100],
  practice: [10, 25, 50, 100],
};

export default function ConfigBar({ config, onChange }: Props) {
  const subOpts = SUB_OPTIONS[config.mode];

  return (
    <div className="config-bar">
      <div className="config-group">
        {MODES.map((m) => (
          <button
            key={m.id}
            className={`config-btn${config.mode === m.id ? " config-btn-active" : ""}`}
            onClick={() => {
              const defaults: Record<TestMode, number> = {
                time: 30,
                words: 25,
                practice: 25,
                zen: 0,
                survival: 30,
                "sudden-death": 0,
              };
              onChange({ mode: m.id, amount: defaults[m.id] });
            }}
          >
            <span className="config-btn-icon">{MODE_ICONS[m.id]}</span>
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
                className={`config-btn${config.amount === n ? " config-btn-active" : ""}`}
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
