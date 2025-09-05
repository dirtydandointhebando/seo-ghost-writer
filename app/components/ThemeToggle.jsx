"use client";
import { useEffect, useState } from "react";

const OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "synthwave", label: "Synthwave" },
];

function applyTheme(t) {
  const el = document.documentElement;
  el.dataset.theme = t;
  try { localStorage.setItem("theme", t); } catch {}
}

export default function ThemeToggle() {
  // Default = light
  const [theme, setTheme] = useState("light");

  // On mount, load saved theme if any; otherwise keep "light"
  useEffect(() => {
    let saved = null;
    try { saved = localStorage.getItem("theme"); } catch {}
    const next = OPTIONS.some(o => o.value === saved) ? saved : "light";
    setTheme(next);
    applyTheme(next);
  }, []);

  const onChange = (e) => {
    const next = e.target.value;
    setTheme(next);
    applyTheme(next);
  };

  return (
    <label className="inline-flex items-center gap-2 rounded-xl border px-2 py-1 bg-white/80 backdrop-blur text-sm">
      <span className="sr-only">Theme</span>
      <select
        value={theme}
        onChange={onChange}
        aria-label="Theme"
        className="bg-transparent outline-none"
      >
        {OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
