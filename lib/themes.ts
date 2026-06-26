export interface Theme {
  name: string;
  label: string;
  vars: Record<string, string>;
}

export const THEMES: Theme[] = [
  {
    name: "ember",
    label: "ember (default)",
    vars: {
      "--bg": "#0a0a0a",
      "--bg-card": "#111111",
      "--text": "#e0e0e0",
      "--sub": "#555555",
      "--sub-alt": "#333333",
      "--accent": "#e63946",
      "--accent-dim": "#7a1f27",
      "--correct": "#c9c9c9",
      "--incorrect": "#e63946",
      "--incorrect-extra": "#b02030",
      "--caret": "#e63946",
      "--caret-blink": "transparent",
      "--border": "#1e1e1e",
    },
  },
  {
    name: "midnight",
    label: "midnight",
    vars: {
      "--bg": "#0d0f1a",
      "--bg-card": "#13162a",
      "--text": "#d4d8f0",
      "--sub": "#444768",
      "--sub-alt": "#252840",
      "--accent": "#7c6fcd",
      "--accent-dim": "#3d3466",
      "--correct": "#b8bcd8",
      "--incorrect": "#e05474",
      "--incorrect-extra": "#a03050",
      "--caret": "#7c6fcd",
      "--caret-blink": "transparent",
      "--border": "#1e2135",
    },
  },
  {
    name: "mint",
    label: "mint",
    vars: {
      "--bg": "#0d1a14",
      "--bg-card": "#111f18",
      "--text": "#d0e8da",
      "--sub": "#3a5c48",
      "--sub-alt": "#1e3328",
      "--accent": "#3ddc84",
      "--accent-dim": "#1a6b3e",
      "--correct": "#a8d8b8",
      "--incorrect": "#e05474",
      "--incorrect-extra": "#a03050",
      "--caret": "#3ddc84",
      "--caret-blink": "transparent",
      "--border": "#1c3025",
    },
  },
  {
    name: "serika",
    label: "serika",
    vars: {
      "--bg": "#323437",
      "--bg-card": "#2c2e31",
      "--text": "#d1d0c5",
      "--sub": "#646669",
      "--sub-alt": "#3a3c3f",
      "--accent": "#e2b714",
      "--accent-dim": "#7a6109",
      "--correct": "#d1d0c5",
      "--incorrect": "#ca4754",
      "--incorrect-extra": "#8a2030",
      "--caret": "#e2b714",
      "--caret-blink": "transparent",
      "--border": "#404245",
    },
  },
  {
    name: "light",
    label: "light",
    vars: {
      "--bg": "#f5f5f5",
      "--bg-card": "#eeeeee",
      "--text": "#1a1a1a",
      "--sub": "#999999",
      "--sub-alt": "#dddddd",
      "--accent": "#e63946",
      "--accent-dim": "#f8c0c3",
      "--correct": "#222222",
      "--incorrect": "#e63946",
      "--incorrect-extra": "#b02030",
      "--caret": "#e63946",
      "--caret-blink": "transparent",
      "--border": "#e0e0e0",
    },
  },
];

export const DEFAULT_THEME = "ember";

export function applyTheme(name: string): void {
  const theme = THEMES.find((t) => t.name === name) ?? THEMES[0];
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
  root.setAttribute("data-theme", theme.name);
}
