"use client";
import { useState } from "react";

/**
 * CopyButton: copies text from an element by id (default "draft-output")
 * and shows "Copied!" + ✓ for ~1.5s. Also announces via aria-live.
 */
export default function CopyButton({
  targetId = "draft-output",
  label = "Copy to Clipboard",
  className = "",
}) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      // prefer element by id, fallback to data attribute
      const el =
        document.getElementById(targetId) ||
        document.querySelector('[data-draft="1"]');
      const text = el ? (el.innerText || el.textContent || "") : "";
      if (!text) throw new Error("Nothing to copy");
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error("Copy failed:", e);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={onCopy}
        className={`rounded-xl border px-3 py-2 text-sm transition-transform active:scale-95 ${className}`}
      >
        {copied ? "Copied!" : label}
        {copied && <span aria-hidden="true" className="ml-2">✓</span>}
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </>
  );
}
