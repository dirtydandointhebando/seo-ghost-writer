"use client";
import { useEffect, useState } from "react";

const THEMES = ["light", "dark", "synthwave"];

function applyTheme(t) {
  const el = document.documentElement;
  el.dataset.theme = t;
  try { localStorage.setItem("theme", t); } catch {}
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved) return setTheme(saved);
    } catch {}
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? "dark" : "light");
  }, []);

  useEffect(() => { applyTheme(theme); }, [theme]);

  const next = () => setTheme(THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]);
  const label = theme === "light" ? "Light" : theme === "dark" ? "Dark" : "Synthwave";

  return (
    <button
      onClick={next}
      className="rounded-xl border px-3 py-2 text-sm"
      aria-label={`Theme: ${label} (click to change)`}
      title={`Theme: ${label} (click to change)`}
    >
      Theme: {label}
    </button>
  );
}
