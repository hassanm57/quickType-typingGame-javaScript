export interface KeystrokeEntry {
  timestamp: number;
  correct: boolean;
}

export interface TestStats {
  wpm: number;
  raw: number;
  accuracy: number;
  consistency: number;
  time: number;
  chars: { correct: number; incorrect: number; extra: number; missed: number };
}

export function calcWpm(correctChars: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  return Math.round((correctChars / 5) / (elapsedMs / 60000));
}

export function calcRaw(totalChars: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  return Math.round((totalChars / 5) / (elapsedMs / 60000));
}

export function calcAccuracy(correctChars: number, totalChars: number): number {
  if (totalChars === 0) return 100;
  return Math.round((correctChars / totalChars) * 100);
}

// Consistency: derived from per-second raw WPM variance
// Lower variance = higher consistency (100% = perfectly even pace)
export function calcConsistency(log: KeystrokeEntry[], startTime: number): number {
  if (log.length < 2) return 100;

  const buckets = new Map<number, number>();
  for (const entry of log) {
    const sec = Math.floor((entry.timestamp - startTime) / 1000);
    buckets.set(sec, (buckets.get(sec) ?? 0) + 1);
  }

  const wpms = [...buckets.values()].map((c) => (c / 5) * 60);
  if (wpms.length < 2) return 100;

  const mean = wpms.reduce((a, b) => a + b, 0) / wpms.length;
  if (mean === 0) return 100;
  const variance = wpms.reduce((sum, v) => sum + (v - mean) ** 2, 0) / wpms.length;
  const cv = Math.sqrt(variance) / mean; // coefficient of variation
  return Math.max(0, Math.round((1 - Math.min(cv, 1)) * 100));
}

export function buildFinalStats(
  words: string[],
  wordStates: CharState[][],
  log: KeystrokeEntry[],
  startTime: number,
  endTime: number
): TestStats {
  const elapsedMs = endTime - startTime;
  let correct = 0;
  let incorrect = 0;
  let extra = 0;
  let missed = 0;

  words.forEach((word, wi) => {
    const state = wordStates[wi] ?? [];
    word.split("").forEach((_, ci) => {
      const s = state[ci];
      if (s === "correct") correct++;
      else if (s === "incorrect") incorrect++;
      else missed++;
    });
    // extra chars beyond the word length
    state.slice(word.length).forEach((s) => {
      if (s === "extra") extra++;
    });
  });

  const totalChars = log.length;
  const consistency = calcConsistency(log, startTime);

  return {
    wpm: calcWpm(correct, elapsedMs),
    raw: calcRaw(totalChars, elapsedMs),
    accuracy: calcAccuracy(correct, totalChars),
    consistency,
    time: Math.round(elapsedMs / 1000),
    chars: { correct, incorrect, extra, missed },
  };
}

export type CharState = "correct" | "incorrect" | "extra" | "pending";

// Per-second WPM samples for the chart
export interface WpmSample {
  second: number;
  wpm: number;
  raw: number;
  errors: number;
}

export function buildWpmSamples(log: KeystrokeEntry[], startTime: number): WpmSample[] {
  if (log.length === 0) return [];
  const maxSec = Math.floor((log[log.length - 1].timestamp - startTime) / 1000) + 1;
  const samples: WpmSample[] = [];

  for (let s = 1; s <= maxSec; s++) {
    const slice = log.filter((e) => e.timestamp - startTime <= s * 1000);
    const correct = slice.filter((e) => e.correct).length;
    const total = slice.length;
    const errorsThisSec = log.filter(
      (e) =>
        !e.correct &&
        e.timestamp - startTime > (s - 1) * 1000 &&
        e.timestamp - startTime <= s * 1000
    ).length;
    samples.push({
      second: s,
      wpm: calcWpm(correct, s * 1000),
      raw: calcRaw(total, s * 1000),
      errors: errorsThisSec,
    });
  }
  return samples;
}
