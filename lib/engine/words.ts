import WORDS from "@/data/words";
import { hasSufficientPracticeData, loadWordStats, scoreWordWeakness } from "./wordStats";

export function generateWords(count: number): string[] {
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(WORDS[Math.floor(Math.random() * WORDS.length)]);
  }
  return result;
}

// Weighted sampling toward words/letters the user tends to mistype or
// type slowly. Falls back to plain random until there's enough history
// to trust (cold start), and always keeps a baseline weight of 1 for
// every word so practice sessions stay varied rather than looping the
// same handful of worst offenders.
export function generatePracticeWords(count: number): string[] {
  const stats = loadWordStats();
  if (!hasSufficientPracticeData(stats)) {
    return generateWords(count);
  }

  const weights = WORDS.map((w) => 1 + 9 * scoreWordWeakness(w, stats));
  const cumulative: number[] = [];
  let sum = 0;
  for (const w of weights) {
    sum += w;
    cumulative.push(sum);
  }

  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    const r = Math.random() * sum;
    let lo = 0;
    let hi = cumulative.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cumulative[mid] < r) lo = mid + 1;
      else hi = mid;
    }
    result.push(WORDS[lo]);
  }
  return result;
}
