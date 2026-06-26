"use client";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import type { UseTypingTestReturn, TestConfig } from "@/lib/engine/useTypingTest";
import { playKeystroke } from "@/lib/sound";
import LiveStats from "./LiveStats";

interface TestAreaProps extends UseTypingTestReturn {
  soundEnabled: boolean;
  config: TestConfig;
}

export default function TestArea(props: TestAreaProps) {
  const {
    status,
    words,
    activeWordIndex,
    currentInput,
    wordStates,
    caretPosition,
    liveStats,
    handleInput,
    handleKeyDown,
    soundEnabled,
    config,
  } = props;

  const inputRef = useRef<HTMLInputElement>(null);
  const wordsRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLDivElement>(null);

  // Focus on mount and whenever test restarts
  useEffect(() => {
    inputRef.current?.focus();
  }, [status]);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  // Position the caret after every render
  useLayoutEffect(() => {
    if (!wordsRef.current || !caretRef.current) return;
    const container = wordsRef.current;
    // Find the element with data-caret="true"
    const target = container.querySelector<HTMLElement>("[data-caret='true']");
    if (!target) return;

    const cRect = container.getBoundingClientRect();
    const tRect = target.getBoundingClientRect();

    caretRef.current.style.left = `${tRect.left - cRect.left}px`;
    caretRef.current.style.top = `${tRect.top - cRect.top + container.scrollTop}px`;
    caretRef.current.style.height = `${tRect.height}px`;
  });

  // Scroll active word into view (keep it on row 2)
  useLayoutEffect(() => {
    if (!wordsRef.current) return;
    const active = wordsRef.current.querySelector<HTMLElement>(".word-active");
    if (!active) return;
    const container = wordsRef.current;
    const lineH = parseFloat(getComputedStyle(container).lineHeight) || 44.8;
    // Scroll so that the active word is always on the first visible line
    const targetTop = active.offsetTop - lineH;
    container.scrollTop = Math.max(0, targetTop);
  }, [activeWordIndex]);

  const onInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (soundEnabled) playKeystroke();
      handleInput(e.target.value);
    },
    [handleInput, soundEnabled]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      handleKeyDown(e);
    },
    [handleKeyDown]
  );

  return (
    <div className="test-area" onClick={focusInput}>
      {/* Hidden input captures all keystrokes */}
      <input
        ref={inputRef}
        className="typing-input"
        value={currentInput}
        onChange={onInput}
        onKeyDown={onKeyDown}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        tabIndex={-1}
        aria-label="Typing input"
      />

      <LiveStats stats={liveStats} status={status} config={config} />

      <div className="words-wrapper" ref={wordsRef}>
        {/* Caret */}
        <div
          ref={caretRef}
          className={`caret ${status !== "running" ? "caret-blink" : ""}`}
          aria-hidden
        />

        {words.map((word, wi) => {
          const states = wordStates[wi] ?? [];
          const isActive = wi === activeWordIndex;
          const isDone = wi < activeWordIndex;

          return (
            <span
              key={wi}
              className={`word${isDone ? " word-done" : ""}${isActive ? " word-active" : ""}`}
            >
              {word.split("").map((ch, ci) => {
                const state = states[ci];
                let cls = "char char-pending";
                if (state === "correct") cls = "char char-correct";
                else if (state === "incorrect") cls = "char char-incorrect";
                const isCaret = isActive && caretPosition.charIndex === ci;
                return (
                  <span key={ci} className={cls} data-caret={isCaret ? "true" : undefined}>
                    {ch}
                  </span>
                );
              })}

              {/* Extra chars typed beyond word length */}
              {Array.from({ length: Math.max(0, states.length - word.length) }).map((_, ei) => {
                const isCaret = isActive && caretPosition.charIndex === word.length + ei;
                return (
                  <span
                    key={`x${ei}`}
                    className="char char-extra"
                    data-caret={isCaret ? "true" : undefined}
                  >
                    {isActive ? currentInput[word.length + ei] ?? "" : ""}
                  </span>
                );
              })}

              {/* Caret anchor at end when cursor is past all chars */}
              {isActive &&
                caretPosition.charIndex >=
                  word.length + Math.max(0, states.length - word.length) && (
                  <span className="char char-pending" data-caret="true">
                    &nbsp;
                  </span>
                )}
            </span>
          );
        })}
      </div>

      {status !== "finished" && (
        <p className="hint hint-keys">
          <kbd>tab</kbd> — restart
        </p>
      )}
    </div>
  );
}
