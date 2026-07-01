import type { CharState } from "./wpm";

export interface WordStat {
  attempts: number;
  errors: number;
  correctChars: number;
  incorrectChars: number;
  totalTimeMs: number;
  lastSeen: number;
}

export interface CharStat {
  correct: number;
  incorrect: number;
}

export interface WordStatsBlob {
  version: 1;
  words: Record<string, WordStat>;
  chars: Record<string, CharStat>;
  totalCommits: number;
}

const STORAGE_KEY = "qt:wordstats";

const MIN_ATTEMPTS_FOR_WORD_SIGNAL = 3;
const MIN_CHAR_SAMPLES = 5;
const COLD_START_MIN_COMMITS = 30;
const MAX_TRACKED_WORDS = 500;

function emptyBlob(): WordStatsBlob {
  return { version: 1, words: {}, chars: {}, totalCommits: 0 };
}

export function loadWordStats(): WordStatsBlob {
  if (typeof window === "undefined") return emptyBlob();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyBlob();
    const parsed = JSON.parse(raw);
    return { ...emptyBlob(), ...parsed };
  } catch {
    return emptyBlob();
  }
}

export function saveWordStats(blob: WordStatsBlob): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(blob));
  } catch {
    // localStorage unavailable/full — silently drop, stats are best-effort
  }
}

export function resetWordStats(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function pruneWords(blob: WordStatsBlob): void {
  const entries = Object.entries(blob.words);
  if (entries.length <= MAX_TRACKED_WORDS) return;
  entries.sort((a, b) => {
    if (a[1].attempts !== b[1].attempts) return a[1].attempts - b[1].attempts;
    return a[1].lastSeen - b[1].lastSeen;
  });
  const toEvict = entries.slice(0, entries.length - MAX_TRACKED_WORDS);
  for (const [word] of toEvict) delete blob.words[word];
}

export function recordWordResult(word: string, states: CharState[], timeMs: number): void {
  if (!word) return;
  const blob = loadWordStats();

  const isError = states.length !== word.length || states.some((s) => s !== "correct");
  let correctChars = 0;
  let incorrectChars = 0;

  word.split("").forEach((ch, ci) => {
    const state = states[ci];
    if (state === "pending" || state === undefined) return; // no keystroke happened for this char
    const key = ch.toLowerCase();
    const charStat = blob.chars[key] ?? { correct: 0, incorrect: 0 };
    if (state === "correct") {
      charStat.correct++;
      correctChars++;
    } else {
      charStat.incorrect++;
      incorrectChars++;
    }
    blob.chars[key] = charStat;
  });

  const wordStat = blob.words[word] ?? {
    attempts: 0,
    errors: 0,
    correctChars: 0,
    incorrectChars: 0,
    totalTimeMs: 0,
    lastSeen: 0,
  };
  wordStat.attempts++;
  if (isError) wordStat.errors++;
  wordStat.correctChars += correctChars;
  wordStat.incorrectChars += incorrectChars;
  wordStat.totalTimeMs += Math.max(0, timeMs);
  wordStat.lastSeen = Date.now();
  blob.words[word] = wordStat;

  blob.totalCommits++;

  pruneWords(blob);
  saveWordStats(blob);
}

export function hasSufficientPracticeData(blob?: WordStatsBlob): boolean {
  const data = blob ?? loadWordStats();
  return data.totalCommits >= COLD_START_MIN_COMMITS;
}

function globalAvgMsPerChar(blob: WordStatsBlob): number {
  let totalMs = 0;
  let totalChars = 0;
  for (const stat of Object.values(blob.words)) {
    totalMs += stat.totalTimeMs;
    totalChars += stat.correctChars + stat.incorrectChars;
  }
  return totalChars > 0 ? totalMs / totalChars : 0;
}

function wordAvgMsPerChar(stat: WordStat): number {
  const chars = stat.correctChars + stat.incorrectChars;
  return chars > 0 ? stat.totalTimeMs / chars : 0;
}

function wordAccuracy(stat: WordStat): number {
  return stat.attempts > 0 ? Math.round(((stat.attempts - stat.errors) / stat.attempts) * 100) : 100;
}

export function scoreWordWeakness(word: string, blob: WordStatsBlob): number {
  const stat = blob.words[word];

  const wordAttempts = stat?.attempts ?? 0;
  const wordErrorRate = stat && stat.attempts > 0 ? stat.errors / stat.attempts : 0;
  const wordConfidence = Math.min(1, wordAttempts / MIN_ATTEMPTS_FOR_WORD_SIGNAL);
  const wordErrorScore = wordErrorRate * wordConfidence;

  const uniqueChars = [...new Set(word.toLowerCase().split(""))];
  const charScores = uniqueChars.map((ch) => {
    const cs = blob.chars[ch];
    if (!cs) return 0;
    const samples = cs.correct + cs.incorrect;
    if (samples === 0) return 0;
    const errorRate = cs.incorrect / samples;
    const confidence = Math.min(1, samples / MIN_CHAR_SAMPLES);
    return errorRate * confidence;
  });
  const charScore = charScores.length > 0 ? charScores.reduce((a, b) => a + b, 0) / charScores.length : 0;

  let timeScore = 0;
  if (stat && stat.attempts > 0) {
    const globalAvg = globalAvgMsPerChar(blob);
    const wordAvg = wordAvgMsPerChar(stat);
    if (globalAvg > 0) {
      timeScore = Math.min(1, Math.max(0, wordAvg / globalAvg - 1));
    }
  }

  const weakness = 0.5 * wordErrorScore + 0.35 * charScore + 0.15 * timeScore;
  return Math.min(1, Math.max(0, weakness));
}

export interface RankedWord {
  word: string;
  attempts: number;
  accuracy: number;
  avgMsPerChar: number;
  score: number;
}

// Listing thresholds are intentionally looser than MIN_ATTEMPTS_FOR_WORD_SIGNAL
// (which governs how much to *trust* a word's own error rate inside the
// weighted score). With a ~400-word dictionary sampled uniformly, a single
// word rarely gets typed 3+ times within many sessions, so requiring that
// just to *display* it would leave these lists empty for a very long time.
// A word only needs to have actually been mistyped once to be worth
// showing as "weak", and two clean reps to count as "mastered".
export function getWeakWords(limit = 20): RankedWord[] {
  const blob = loadWordStats();
  return Object.entries(blob.words)
    .filter(([, stat]) => stat.errors > 0)
    .map(([word, stat]) => ({
      word,
      attempts: stat.attempts,
      accuracy: wordAccuracy(stat),
      avgMsPerChar: Math.round(wordAvgMsPerChar(stat)),
      score: scoreWordWeakness(word, blob),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function getMasteredWords(limit = 20): RankedWord[] {
  const blob = loadWordStats();
  return Object.entries(blob.words)
    .filter(([, stat]) => stat.attempts >= 2 && stat.errors === 0)
    .map(([word, stat]) => ({
      word,
      attempts: stat.attempts,
      accuracy: wordAccuracy(stat),
      avgMsPerChar: Math.round(wordAvgMsPerChar(stat)),
      score: scoreWordWeakness(word, blob),
    }))
    .sort((a, b) => a.avgMsPerChar - b.avgMsPerChar)
    .slice(0, limit);
}
