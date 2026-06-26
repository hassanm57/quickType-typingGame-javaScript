"use client";
import { useEffect, useRef } from "react";
import type { WpmSample } from "@/lib/engine/wpm";

interface Props {
  samples: WpmSample[];
}

export default function WpmChart({ samples }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || samples.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const PAD = { top: 16, right: 16, bottom: 32, left: 40 };

    ctx.clearRect(0, 0, W, H);

    const maxWpm = Math.max(...samples.map((s) => Math.max(s.wpm, s.raw)), 1);
    const xs = samples.length;

    const toX = (i: number) => PAD.left + (i / (xs - 1 || 1)) * (W - PAD.left - PAD.right);
    const toY = (v: number) => PAD.top + (1 - v / maxWpm) * (H - PAD.top - PAD.bottom);

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let g = 0; g <= 4; g++) {
      const y = toY((maxWpm * g) / 4);
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(W - PAD.right, y);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "10px monospace";
      ctx.fillText(String(Math.round((maxWpm * g) / 4)), 4, y + 4);
    }

    // X-axis labels
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "10px monospace";
    const step = Math.ceil(xs / 6);
    samples.forEach((s, i) => {
      if (i % step === 0 || i === xs - 1) {
        ctx.fillText(String(s.second), toX(i) - 6, H - 8);
      }
    });

    // Raw WPM line (dim)
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#e63946";
    ctx.strokeStyle = "rgba(128,128,128,0.4)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    samples.forEach((s, i) => {
      i === 0 ? ctx.moveTo(toX(i), toY(s.raw)) : ctx.lineTo(toX(i), toY(s.raw));
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // WPM line
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    samples.forEach((s, i) => {
      i === 0 ? ctx.moveTo(toX(i), toY(s.wpm)) : ctx.lineTo(toX(i), toY(s.wpm));
    });
    ctx.stroke();

    // Error dots
    samples.forEach((s, i) => {
      if (s.errors > 0) {
        ctx.beginPath();
        ctx.arc(toX(i), toY(s.wpm), 4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(230,57,70,0.6)";
        ctx.fill();
      }
    });
  }, [samples]);

  if (samples.length === 0) return null;

  return (
    <div className="chart-wrapper">
      <canvas ref={canvasRef} width={700} height={180} className="wpm-chart" />
      <div className="chart-legend">
        <span className="legend-wpm">— wpm</span>
        <span className="legend-raw">- - raw</span>
        <span className="legend-err">● errors</span>
      </div>
    </div>
  );
}
