"use client";
import { useEffect, useRef, useState } from "react";
import type { TestStats, WpmSample } from "@/lib/engine/wpm";
import type { TestConfig } from "@/lib/engine/useTypingTest";
import { checkAndSavePB, loadPB, type PersonalBest } from "@/lib/storage";
import { playVictory } from "@/lib/sound";
import WpmChart from "./WpmChart";

interface Props {
  stats: TestStats;
  samples: WpmSample[];
  config: TestConfig;
  onRestart: () => void;
  soundEnabled: boolean;
}

export default function Results({ stats, samples, config, onRestart, soundEnabled }: Props) {
  const [isNewPB, setIsNewPB] = useState(false);
  const [prevBest, setPrevBest] = useState<PersonalBest | null>(null);
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;
    const prev = loadPB(config);
    setPrevBest(prev);
    const newPB = checkAndSavePB(config, stats);
    setIsNewPB(newPB);
    if (newPB && soundEnabled) playVictory();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const charStr = `${stats.chars.correct}/${stats.chars.incorrect}/${stats.chars.extra}/${stats.chars.missed}`;

  return (
    <div className="results results-enter">
      {isNewPB && <div className="pb-badge">new personal best!</div>}

      {/* Two-column hero: stats left, chart right */}
      <div className="results-top">
        <div className="results-hero">
          <div className="result-hero-item">
            <span className="result-hero-label">wpm</span>
            <span className="result-hero-value">{stats.wpm}</span>
          </div>
          <div className="result-hero-item">
            <span className="result-hero-label">acc</span>
            <span className="result-hero-value">{stats.accuracy}%</span>
          </div>
        </div>
        <div className="results-chart">
          <WpmChart samples={samples} />
        </div>
      </div>

      {/* Stats row */}
      <div className="results-secondary">
        <StatTile label="test type" value={`${config.mode} ${config.amount || ""}`} dim />
        <StatTile label="raw" value={stats.raw} />
        <StatTile label="characters" value={charStr} />
        <StatTile label="consistency" value={`${stats.consistency}%`} />
        <StatTile label="time" value={`${stats.time}s`} />
        {prevBest && !isNewPB && <StatTile label="best" value={prevBest.wpm} dim />}
      </div>

      <div className="results-actions">
        <button className="btn-primary" onClick={onRestart}>
          next test
        </button>
        <p className="hint hint-keys"><kbd>tab</kbd> — restart</p>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  accent,
  danger,
  dim,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
  danger?: boolean;
  dim?: boolean;
}) {
  let cls = "stat-value";
  if (accent) cls += " stat-accent";
  if (danger) cls += " stat-danger";
  if (dim) cls += " stat-dim";
  return (
    <div className="stat-tile">
      <span className="stat-label">{label}</span>
      <span className={cls}>{value}</span>
    </div>
  );
}
