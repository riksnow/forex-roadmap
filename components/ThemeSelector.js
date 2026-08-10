"use client";

import { useTheme } from "./ThemeProvider";

const OPTIONS = [
  { value: "dark", label: "Dark", bg: "#0b0e14", dot: "#26a69a" },
  { value: "light", label: "Light", bg: "#f6f7f9", dot: "#1f8f82" },
  {
    value: "system",
    label: "System",
    bg: "linear-gradient(135deg, #0b0e14 50%, #f6f7f9 50%)",
    dot: "#6c8eef",
  },
];

export default function ThemeSelector() {
  const { theme, setTheme, loaded } = useTheme();

  return (
    <div className="theme-grid">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={"theme-option" + (theme === opt.value ? " active" : "")}
          onClick={() => setTheme(opt.value)}
          disabled={!loaded}
          aria-pressed={theme === opt.value}
        >
          <span className="theme-swatch" style={{ background: opt.bg }}>
            <span
              className="theme-swatch-dot"
              style={{ background: opt.dot }}
            ></span>
          </span>
          {opt.label}
        </button>
      ))}
    </div>
  );
}
