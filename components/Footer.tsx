"use client";
import type { Settings } from "@/lib/storage";
import { THEMES } from "@/lib/themes";

interface Props {
  theme: string;
}

export default function Footer({ theme }: Props) {
  const themeLabel = THEMES.find((t) => t.name === theme)?.label ?? theme;
  return (
    <footer className="site-footer">
      <span className="footer-theme">{themeLabel}</span>
      <span className="footer-links">
        <a href="https://github.com/hassanm57/type-speed-tester-js" target="_blank" rel="noopener noreferrer">
          github
        </a>
      </span>
    </footer>
  );
}
