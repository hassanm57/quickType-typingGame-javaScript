"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { generatePracticeWords, generateWords } from "./words";
import { recordWordResult } from "./wordStats";
import {
  type CharState,
  type KeystrokeEntry,
  type TestStats,
  type WpmSample,
  buildFinalStats,
  buildWpmSamples,
  calcAccuracy,
  calcWpm,
} from "./wpm";

export type TestMode = "time" | "words" | "zen" | "survival" | "sudden-death" | "practice";
export type TestStatus = "idle" | "running" | "finished";

export interface TestConfig {
  mode: TestMode;
  /** time = seconds, words = count, others use 0 */
  amount: number;
}

export interface LiveStats {
  wpm: number;
  accuracy: number;
  /** time: seconds left; words: words left; zen/survival/sudden-death: elapsed */
  remaining: number;
}

export interface UseTypingTestReturn {
  status: TestStatus;
  words: string[];
  activeWordIndex: number;
  currentInput: string;
  wordStates: CharState[][];
  liveStats: LiveStats;
  finalStats: TestStats | null;
  wpmSamples: WpmSample[];
  caretPosition: { wordIndex: number; charIndex: number };
  restart: () => void;
  handleInput: (value: string) => void;
  handleKeyDown: (e: React.KeyboardEvent | KeyboardEvent) => void;
}

const BUFFER = 60;
// Live WPM uses a trailing window rather than a whole-test average, so it
// reflects the user's *current* pace instead of slowly drifting — a lifetime
// average barely moves once a test has run for a while, which reads as
// "stuck"/inaccurate if someone speeds up or slows down partway through.
const LIVE_WPM_WINDOW_MS = 5000;

function blankStates(n: number): CharState[][] {
  return Array.from({ length: n }, () => []);
}

function evaluate(target: string, typed: string): CharState[] {
  const len = Math.max(target.length, typed.length);
  return Array.from({ length: len }, (_, i) => {
    if (i >= target.length) return "extra";
    if (i >= typed.length) return "pending";
    return typed[i] === target[i] ? "correct" : "incorrect";
  });
}

function isFixedCountMode(mode: TestMode): boolean {
  return mode === "words" || mode === "practice";
}

function generateWordsFor(mode: TestMode, n: number): string[] {
  return mode === "practice" ? generatePracticeWords(n) : generateWords(n);
}

export default function useTypingTest(config: TestConfig): UseTypingTestReturn {
  const { mode, amount } = config;

  const initialCount = isFixedCountMode(mode) ? amount : amount * 4 + BUFFER;

  // ── Reactive state ──────────────────────────────────────────────────────────
  const [words, setWords] = useState<string[]>(() => generateWordsFor(mode, initialCount));
  const [wordStates, setWordStates] = useState<CharState[][]>(() => blankStates(initialCount));
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [currentInput, setCurrentInput] = useState("");
  const [status, setStatus] = useState<TestStatus>("idle");
  const [finalStats, setFinalStats] = useState<TestStats | null>(null);
  const [wpmSamples, setWpmSamples] = useState<WpmSample[]>([]);
  const [tick, setTick] = useState(0);
  const [liveWpm, setLiveWpm] = useState(0);

  // ── Refs (mutable, no re-render needed) ─────────────────────────────────────
  const wordsRef = useRef<string[]>(words);
  const wordStatesRef = useRef<CharState[][]>(wordStates);
  const activeIndexRef = useRef(0);
  const typedWordsRef = useRef<string[]>([]);
  const currentInputRef = useRef("");
  const startTimeRef = useRef(0);
  const keystrokeLog = useRef<KeystrokeEntry[]>([]);
  const bonusTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusRef = useRef<TestStatus>("idle");
  const lastWpmSecondRef = useRef(0);
  const wordStartTimeRef = useRef(0);

  // Keep refs in sync with state
  useEffect(() => { wordsRef.current = words; }, [words]);
  useEffect(() => { wordStatesRef.current = wordStates; }, [wordStates]);

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const finishTest = useCallback((finalStates: CharState[][]) => {
    stopTimer();
    const endTime = Date.now();
    statusRef.current = "finished";
    setStatus("finished");
    const stats = buildFinalStats(
      wordsRef.current,
      finalStates,
      keystrokeLog.current,
      startTimeRef.current,
      endTime
    );
    setFinalStats(stats);
    setWpmSamples(buildWpmSamples(keystrokeLog.current, startTimeRef.current));
  }, [stopTimer]);

  const finishTestRef = useRef(finishTest);
  useEffect(() => { finishTestRef.current = finishTest; }, [finishTest]);

  const restart = useCallback(() => {
    stopTimer();
    const n = isFixedCountMode(mode) ? amount : amount * 4 + BUFFER;
    const w = generateWordsFor(mode, n);
    const ws = blankStates(n);
    wordsRef.current = w;
    wordStatesRef.current = ws;
    activeIndexRef.current = 0;
    typedWordsRef.current = [];
    currentInputRef.current = "";
    keystrokeLog.current = [];
    startTimeRef.current = 0;
    bonusTimeRef.current = 0;
    statusRef.current = "idle";
    lastWpmSecondRef.current = 0;
    wordStartTimeRef.current = 0;
    setWords(w);
    setWordStates(ws);
    setActiveWordIndex(0);
    setCurrentInput("");
    setStatus("idle");
    setFinalStats(null);
    setWpmSamples([]);
    setTick(0);
    setLiveWpm(0);
  }, [mode, amount, stopTimer]);

  // Restart when config changes
  useEffect(() => { restart(); }, [mode, amount]); // eslint-disable-line react-hooks/exhaustive-deps

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      // Time / survival expiry
      if (mode === "time" && elapsed >= amount) {
        finishTestRef.current(wordStatesRef.current);
        return;
      }
      if (mode === "survival" && elapsed >= amount + bonusTimeRef.current) {
        finishTestRef.current(wordStatesRef.current);
        return;
      }
      const currentSecond = Math.floor(elapsed);
      if (currentSecond !== lastWpmSecondRef.current) {
        lastWpmSecondRef.current = currentSecond;
        const now = Date.now();
        const windowStart = Math.max(startTimeRef.current, now - LIVE_WPM_WINDOW_MS);
        const correctInWindow = keystrokeLog.current.filter(
          (e) => e.correct && e.timestamp >= windowStart
        ).length;
        setLiveWpm(calcWpm(correctInWindow, now - windowStart));
      }
      setTick((t) => t + 1);
    }, 200);
  }, [mode, amount]);

  // ── Live stats (recomputed on tick) ─────────────────────────────────────────
  const liveStats: LiveStats = (() => {
    if (statusRef.current === "idle") return { wpm: 0, accuracy: 100, remaining: amount };
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const log = keystrokeLog.current;
    const correct = log.filter((e) => e.correct).length;
    const accuracy = calcAccuracy(correct, log.length);
    let remaining = 0;
    if (mode === "time") remaining = Math.max(0, amount - elapsed);
    else if (mode === "survival") remaining = Math.max(0, amount + bonusTimeRef.current - elapsed);
    else if (isFixedCountMode(mode)) remaining = Math.max(0, amount - activeIndexRef.current);
    else remaining = Math.round(elapsed);
    return { wpm: liveWpm, accuracy, remaining: Math.round(remaining) };
  })();

  // ── Input handler ────────────────────────────────────────────────────────────
  const handleInput = useCallback(
    (value: string) => {
      if (statusRef.current === "finished") return;

      // Start on first real character
      if (statusRef.current === "idle" && value.trim() !== "") {
        statusRef.current = "running";
        setStatus("running");
        startTimer();
        wordStartTimeRef.current = Date.now();
      }

      const wi = activeIndexRef.current;
      const target = wordsRef.current[wi] ?? "";

      // ── Space commits current word ─────────────────────────────────────────
      if (value.endsWith(" ")) {
        const typed = value.trimEnd();
        typedWordsRef.current = [...typedWordsRef.current, typed];

        const states = evaluate(target, typed);
        const newWordStates = [...wordStatesRef.current];
        newWordStates[wi] = states;
        wordStatesRef.current = newWordStates;
        setWordStates([...newWordStates]);

        // Log chars for this word
        target.split("").forEach((ch, ci) => {
          keystrokeLog.current.push({
            timestamp: Date.now(),
            correct: typed[ci] === ch,
          });
        });

        recordWordResult(target, states, Date.now() - wordStartTimeRef.current);

        // Sudden death: incorrect commit ends game
        if (mode === "sudden-death" && states.some((s) => s === "incorrect" || s === "extra")) {
          finishTestRef.current(newWordStates);
          return;
        }

        const nextIndex = wi + 1;
        activeIndexRef.current = nextIndex;
        setActiveWordIndex(nextIndex);
        currentInputRef.current = "";
        setCurrentInput("");
        wordStartTimeRef.current = Date.now();

        // Survival: every 5 words = +10s
        if (mode === "survival" && nextIndex % 5 === 0) {
          bonusTimeRef.current += 10;
        }

        // Words/practice mode: finishing last word ends game
        if (isFixedCountMode(mode) && nextIndex >= amount) {
          finishTestRef.current(newWordStates);
          return;
        }

        // Extend buffer
        if (!isFixedCountMode(mode) && nextIndex >= wordsRef.current.length - 15) {
          const more = generateWords(BUFFER);
          const moreStates = blankStates(BUFFER);
          setWords((prev) => { const next = [...prev, ...more]; wordsRef.current = next; return next; });
          setWordStates((prev) => { const next = [...prev, ...moreStates]; wordStatesRef.current = next; return next; });
        }
        return;
      }

      // ── Track keystrokes for in-progress word ────────────────────────────────
      const prevLen = currentInputRef.current.length;
      if (value.length > prevLen) {
        const ci = value.length - 1;
        const ch = value[ci];
        const isCorrect = ci < target.length && ch === target[ci];
        keystrokeLog.current.push({ timestamp: Date.now(), correct: isCorrect });

        // Sudden death: wrong mid-word char ends game
        if (mode === "sudden-death" && !isCorrect) {
          const states = evaluate(target, value);
          const newWordStates = [...wordStatesRef.current];
          newWordStates[wi] = states;
          currentInputRef.current = value;
          setCurrentInput(value);
          finishTestRef.current(newWordStates);
          return;
        }
      }

      // Update in-progress highlights
      const states = evaluate(target, value);
      setWordStates((prev) => {
        const next = [...prev];
        next[wi] = states;
        wordStatesRef.current = next;
        return next;
      });

      currentInputRef.current = value;
      setCurrentInput(value);

      // Auto-complete last word in words/practice mode (no space required)
      if (isFixedCountMode(mode) && wi === amount - 1 && value === target) {
        typedWordsRef.current = [...typedWordsRef.current, value];
        target.split("").forEach((ch, ci) => {
          keystrokeLog.current.push({ timestamp: Date.now(), correct: value[ci] === ch });
        });
        recordWordResult(target, states, Date.now() - wordStartTimeRef.current);
        finishTestRef.current(wordStatesRef.current);
        return;
      }
    },
    [mode, amount, startTimer]
  );

  // ── Key handler ──────────────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent | KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault();
        restart();
        return;
      }
      // Backspace across word boundary
      if (
        e.key === "Backspace" &&
        currentInputRef.current === "" &&
        activeIndexRef.current > 0
      ) {
        e.preventDefault();
        const prevIndex = activeIndexRef.current - 1;
        const prevTyped = typedWordsRef.current[prevIndex] ?? "";
        typedWordsRef.current = typedWordsRef.current.slice(0, -1);
        activeIndexRef.current = prevIndex;
        setActiveWordIndex(prevIndex);
        currentInputRef.current = prevTyped;
        setCurrentInput(prevTyped);
      }
    },
    [restart]
  );

  const caretPosition = { wordIndex: activeWordIndex, charIndex: currentInput.length };

  return {
    status,
    words,
    activeWordIndex,
    currentInput,
    wordStates,
    liveStats,
    finalStats,
    wpmSamples,
    caretPosition,
    restart,
    handleInput,
    handleKeyDown,
  };
}
