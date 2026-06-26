"use client";
let _enabled = false;

export function setSoundEnabled(v: boolean): void {
  _enabled = v;
}

function play(src: string, volume: number): void {
  if (!_enabled) return;
  const a = new Audio(src);
  a.volume = volume;
  a.play().catch(() => {});
}

export function playKeystroke(): void {
  play("/sounds/type.wav", 0.25);
}

export function playVictory(): void {
  play("/sounds/victory.mp3", 0.4);
}
