"use client";
import type { CharState } from "@/lib/engine/wpm";

interface WordProps {
  word: string;
  states: CharState[];
  isActive: boolean;
  isCurrent: boolean;
  caretCharIndex: number;
}

export default function Word({ word, states, isActive, isCurrent, caretCharIndex }: WordProps) {
  const chars = word.split("");
  // Extra chars typed beyond the word length
  const extraCount = Math.max(0, states.length - chars.length);

  return (
    <span className="word">
      {chars.map((ch, i) => {
        const state = states[i];
        let cls = "char char-pending";
        if (state === "correct") cls = "char char-correct";
        else if (state === "incorrect") cls = "char char-incorrect";
        const hasCaret = isCurrent && caretCharIndex === i;
        return (
          <span key={i} className={cls} data-caret={hasCaret ? "true" : undefined}>
            {ch}
          </span>
        );
      })}
      {/* Extra chars the user typed beyond the word */}
      {Array.from({ length: extraCount }).map((_, i) => {
        const hasCaret = isCurrent && caretCharIndex === chars.length + i;
        return (
          <span key={`extra-${i}`} className="char char-extra" data-caret={hasCaret ? "true" : undefined}>
            {/* we don't know what char was typed, just mark as extra */}
          </span>
        );
      })}
      {/* Caret at end of word */}
      {isCurrent && caretCharIndex >= chars.length + extraCount && (
        <span className="char char-pending char-caret-anchor" data-caret="true">&nbsp;</span>
      )}
    </span>
  );
}
