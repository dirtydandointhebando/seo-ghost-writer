"use client";
import { useEffect, useState } from "react";

/** FloatingCopy
 * - Looks for #draft-output (or any .prose) and copies its text.
 * - Shows "Copied! ✓" for ~1.5s and announces via aria-live.
 */
export default function FloatingCopy() {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    function findTarget() {
      let el = document.getElementById("draft-output");
      if (!el) {
        // fallback: first markdown-ish container
        el = document.querySelector('[data-draft="1"]') || document.querySelector(".prose");
        if (el && !el.id) el.id = "draft-output";
        if (el) el.setAttribute("data-draft", "1");
      }
      setVisible(!!el);
    }
    const t = setInterval(findTarget, 600);
    findTarget();
    return () => clearInterval(t);
  }, []);

  async function doCopy() {
    try {
      const el =
        document.getElementById("draft-output") ||
        document.querySelector('[data-draft="1"]') ||
        document.querySelector(".prose");
      const text = el ? (el.innerText || el.textContent || "") : "";
      if (!text) return;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error("Copy failed:", e);
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed right-4 bottom-4 z-50">
      <button
        type="button"
        onClick={doCopy}
        className="rounded-xl border bg-white/90 backdrop-blur px-3 py-2 text-sm shadow transition-transform active:scale-95"
      >
        {copied ? "Copied! ✓" : "Copy Markdown"}
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </div>
  );
}
