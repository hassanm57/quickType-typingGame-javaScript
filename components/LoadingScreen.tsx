"use client";
import { useEffect, useRef, useState } from "react";

const LINE1 = "Hello, welcome to quickType!";
const LINE2 = "made by Hassan Mansoor";
const CHAR_MS = 42;
const LINE_PAUSE = 480;
const END_PAUSE = 900;
const FADE_MS = 550;

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [d1, setD1] = useState(0);
  const [d2, setD2] = useState(0);
  const [showL2, setShowL2] = useState(false);
  const [fading, setFading] = useState(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (finishedRef.current) return;

    if (d1 < LINE1.length) {
      const t = setTimeout(() => setD1((n) => n + 1), CHAR_MS);
      return () => clearTimeout(t);
    }

    if (!showL2) {
      const t = setTimeout(() => setShowL2(true), LINE_PAUSE);
      return () => clearTimeout(t);
    }

    if (d2 < LINE2.length) {
      const t = setTimeout(() => setD2((n) => n + 1), CHAR_MS);
      return () => clearTimeout(t);
    }

    finishedRef.current = true;
    const t = setTimeout(() => {
      setFading(true);
      setTimeout(onComplete, FADE_MS);
    }, END_PAUSE);
    return () => clearTimeout(t);
  }, [d1, d2, showL2, onComplete]);

  const line1Done = d1 === LINE1.length;
  const line2Done = d2 === LINE2.length;

  return (
    <div className={`loading-screen${fading ? " loading-fadeout" : ""}`}>
      <div className="loading-content">
        <p className="loading-line">
          {LINE1.slice(0, d1)}
          {!line1Done && <span className="loading-cursor" />}
        </p>
        {showL2 && (
          <p className="loading-line loading-line-sub">
            {LINE2.slice(0, d2)}
            {(!line2Done || !fading) && <span className="loading-cursor" />}
          </p>
        )}
      </div>
    </div>
  );
}
