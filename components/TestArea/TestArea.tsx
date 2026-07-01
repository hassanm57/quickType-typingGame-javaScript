"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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
    restart,
    soundEnabled,
    config,
  } = props;

  const inputRef = useRef<HTMLInputElement>(null);
  const wordsRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLDivElement>(null);
  const isRestartingRef = useRef(false);

  // Smooth tab-restart state
  const [fading, setFading] = useState(false);
  const [enterKey, setEnterKey] = useState(0); // change = remount → triggers enter animation

  // Focus on mount and after restart
  useEffect(() => {
    inputRef.current?.focus();
  }, [status, enterKey]);

  const focusInput = useCallback(() => inputRef.current?.focus(), []);

  // Caret positioning — run after every render, skip during fade/restart
  useLayoutEffect(() => {
    const caret = caretRef.current;
    const container = wordsRef.current;
    if (!caret || !container) return;

    const target = container.querySelector<HTMLElement>("[data-caret='true']");
    if (!target) return;

    const cRect = container.getBoundingClientRect();
    const tRect = target.getBoundingClientRect();
    const left = tRect.left - cRect.left;
    const top = tRect.top - cRect.top + container.scrollTop;

    if (isRestartingRef.current) {
      caret.style.transition = "none";
      caret.style.transform = `translate(${left}px, ${top}px)`;
      caret.style.height = `${tRect.height}px`;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (caretRef.current) caretRef.current.style.transition = "";
          isRestartingRef.current = false;
        });
      });
    } else {
      caret.style.transform = `translate(${left}px, ${top}px)`;
      caret.style.height = `${tRect.height}px`;
    }
  });

  // Scroll to keep active line near the top of the visible area
  useLayoutEffect(() => {
    const container = wordsRef.current;
    if (!container) return;
    const active = container.querySelector<HTMLElement>(".word-active");
    if (!active) return;
    const lineH = parseFloat(getComputedStyle(container).lineHeight) || 44.8;
    container.scrollTop = Math.max(0, active.offsetTop - lineH);
  }, [activeWordIndex]);

  const onInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (soundEnabled) playKeystroke();
      handleInput(e.target.value);
    },
    [handleInput, soundEnabled]
  );

  // Intercept Tab for smooth fade-out → restart → fade-in
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        if (fading) return; // don't double-trigger
        setFading(true);
        setTimeout(() => {
          isRestartingRef.current = true;
          restart();
          setFading(false);
          setEnterKey((k) => k + 1); // remount words-wrapper → enter animation
        }, 200);
        return;
      }
      handleKeyDown(e);
    },
    [handleKeyDown, restart, fading]
  );

  return (
    <div className="test-area" onClick={focusInput}>
      <LiveStats stats={liveStats} status={status} config={config} />
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

      {/* key change on enterKey remounts this div → CSS enter animation plays */}
      <div
        key={enterKey}
        ref={wordsRef}
        className={`words-wrapper${fading ? " words-fading" : ""}`}
      >
        <div
          ref={caretRef}
          className={`caret${status !== "running" ? " caret-blink" : ""}`}
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

              {isActive &&
                caretPosition.charIndex >=
                  word.length + Math.max(0, states.length - word.length) && (
                  <span className="char char-pending char-caret-anchor" data-caret="true">&nbsp;</span>
                )}
            </span>
          );
        })}
      </div>

      {status !== "finished" && (
        <p className="hint hint-keys">
          <kbd>tab</kbd> to restart
        </p>
      )}
    </div>
  );
}
