"use client";
import { useEffect, useState } from "react";

const KEYS = "abcdefghijklmnopqrstuvwxyz.,;'[]!?";

interface FloatItem {
  char: string;
  x: string;
  y: string;
  delay: string;
  dur: string;
  size: string;
  opacity: number;
}

export default function HeroSection() {
  const [items, setItems] = useState<FloatItem[]>([]);

  useEffect(() => {
    setItems(
      Array.from({ length: 28 }, () => ({
        char: KEYS[Math.floor(Math.random() * KEYS.length)],
        x: `${Math.random() * 100}%`,
        y: `${Math.random() * 100}%`,
        delay: `${-(Math.random() * 18)}s`,
        dur: `${14 + Math.random() * 12}s`,
        size: `${0.85 + Math.random() * 0.9}rem`,
        opacity: 0.03 + Math.random() * 0.05,
      }))
    );
  }, []);

  const scrollToTest = () => {
    document.getElementById("test")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="hero-section" id="hero" aria-label="quickType hero">
      {/* ambient floating chars */}
      <div className="hero-float-bg" aria-hidden>
        {items.map((item, i) => (
          <span
            key={i}
            className="hero-float-char"
            style={{
              left: item.x,
              top: item.y,
              animationDelay: item.delay,
              animationDuration: item.dur,
              fontSize: item.size,
              opacity: item.opacity,
            }}
          >
            {item.char}
          </span>
        ))}
      </div>

      {/* center glow */}
      <div className="hero-glow" aria-hidden />

      <div className="hero-content">
        <div className="hero-logo">
          <span className="hero-logo-quick">quick</span>
          <span className="hero-logo-type">Type</span>
          <span className="hero-logo-bang">!</span>
        </div>

        <p className="hero-tagline">Test your speed. Master your keys.</p>

        <div className="hero-features">
          <div className="hero-feature">
            <span className="hero-feature-key">wpm</span>
            <span className="hero-feature-label">real-time speed</span>
          </div>
          <div className="hero-feature-divider" aria-hidden />
          <div className="hero-feature">
            <span className="hero-feature-key">acc</span>
            <span className="hero-feature-label">precision accuracy</span>
          </div>
          <div className="hero-feature-divider" aria-hidden />
          <div className="hero-feature">
            <span className="hero-feature-key">modes</span>
            <span className="hero-feature-label">time, words, zen + more</span>
          </div>
        </div>

        <button className="hero-cta" onClick={scrollToTest}>
          start typing
        </button>
      </div>

      <div className="hero-scroll" aria-hidden>
        <span className="hero-scroll-arrow">↓</span>
      </div>
    </section>
  );
}
