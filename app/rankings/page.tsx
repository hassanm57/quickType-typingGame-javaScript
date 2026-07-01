"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useSettings } from "@/lib/useSettings";
import {
  getMasteredWords,
  getWeakWords,
  loadWordStats,
  resetWordStats,
  type RankedWord,
} from "@/lib/engine/wordStats";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function RankingsPage() {
  const { settings, hydrated, handleSettingsChange } = useSettings();
  const [refreshKey, setRefreshKey] = useState(0);

  const data = useMemo(() => {
    if (!hydrated) return null;
    return {
      blob: loadWordStats(),
      weak: getWeakWords(20),
      mastered: getMasteredWords(20),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, refreshKey]);

  const handleReset = () => {
    if (!window.confirm("Reset all typing stats? This can't be undone.")) return;
    resetWordStats();
    setRefreshKey((k) => k + 1);
  };

  return (
    <>
      {hydrated && (
        <div className="app">
          <Header settings={settings} onSettingsChange={handleSettingsChange} />

          <section className="rankings-section">
            <main className="main rankings-main">
              <div className="rankings-header">
                <h1 className="rankings-title">your rankings</h1>
                <p className="rankings-sub">
                  based on {data?.blob.totalCommits ?? 0} words typed
                </p>
              </div>

              {!data || data.blob.totalCommits === 0 ? (
                <div className="rankings-card rankings-empty-card">
                  <p className="rankings-empty">
                    Complete a few typing tests first — we&apos;ll start tracking your
                    strengths and weaknesses automatically.
                  </p>
                  <Link className="btn-primary" href="/">
                    back to test
                  </Link>
                </div>
              ) : (
                <>
                  <div className="rankings-grid">
                    <RankingCard
                      title="weak words"
                      subtitle="mistyped or slow"
                      words={data.weak}
                      tone="weak"
                      emptyLabel="Not enough data yet for weak words — keep typing."
                    />
                    <RankingCard
                      title="mastered words"
                      subtitle="fast and accurate"
                      words={data.mastered}
                      tone="mastered"
                      emptyLabel="Not enough data yet for mastered words — keep typing."
                    />
                  </div>

                  <div className="rankings-actions">
                    <Link className="btn-primary" href="/">
                      practice these
                    </Link>
                    <button className="rankings-reset" onClick={handleReset}>
                      reset stats
                    </button>
                  </div>
                </>
              )}
            </main>
          </section>

          <Footer theme={settings.theme} />
        </div>
      )}
    </>
  );
}

function RankingCard({
  title,
  subtitle,
  words,
  tone,
  emptyLabel,
}: {
  title: string;
  subtitle: string;
  words: RankedWord[];
  tone: "weak" | "mastered";
  emptyLabel: string;
}) {
  return (
    <div className="rankings-card">
      <h2 className="rankings-card-title">{title}</h2>
      <p className="rankings-card-subtitle">{subtitle}</p>

      {words.length === 0 ? (
        <p className="rankings-empty">{emptyLabel}</p>
      ) : (
        <ol className="rank-list">
          {words.map((w) => (
            <li key={w.word} className="rank-row">
              <span className={`rank-word rank-word-${tone}`}>{w.word}</span>
              <span className="rank-meta">
                {w.accuracy}% · {w.attempts}× · {w.avgMsPerChar}ms/char
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
