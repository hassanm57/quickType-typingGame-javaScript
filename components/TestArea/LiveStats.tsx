"use client";
import type { LiveStats as LiveStatsType, TestConfig } from "@/lib/engine/useTypingTest";
import type { TestStatus } from "@/lib/engine/useTypingTest";

interface Props {
  stats: LiveStatsType;
  status: TestStatus;
  config: TestConfig;
}

export default function LiveStats({ stats, status, config }: Props) {
  const timerLabel =
    config.mode === "words" || config.mode === "practice" ? "words left" :
    config.mode === "zen" || config.mode === "sudden-death" ? "elapsed" :
    ""; // time/survival: just the number

  return (
    <div className={`live-stats${status === "idle" ? " live-stats-idle" : ""}`}>
      <span className="live-stat-value">{stats.wpm}</span>
      <span className="live-stat-label">wpm</span>
      <span className="live-stat-sep" />
      <span className="live-stat-value live-stat-timer">
        {stats.remaining}
        {timerLabel && <span className="live-stat-label" style={{ marginLeft: "0.3rem" }}>{timerLabel}</span>}
      </span>
    </div>
  );
}
