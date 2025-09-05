"use client";
import { useEffect } from "react";

export default function CopyHijack() {
  useEffect(() => {
    // screen-reader live region
    let live = document.getElementById("copy-live");
    if (!live) {
      live = document.createElement("div");
      live.id = "copy-live";
      live.className = "sr-only";
      live.setAttribute("aria-live", "polite");
      document.body.appendChild(live);
    }

    async function doCopyFromDraft() {
      const el =
        document.getElementById("draft-output") ||
        document.querySelector('[data-draft="1"]') ||
        document.querySelector(".prose") ||
        document.querySelector("pre");
      const text = el ? (el.innerText || el.textContent || "") : "";
      if (!text) return false;

      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // fallback for odd browsers
        try {
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
          return true;
        } catch {
          return false;
        }
      }
    }

    const handler = async (e) => {
      const btn = e.target && e.target.closest && e.target.closest("button");
      if (!btn) return;

      const label = (btn.innerText || btn.textContent || "").toLowerCase();
      if (!label.includes("copy")) return; // only intercept copy-like buttons

      // run copy (best-effort); we still show feedback either way
      const ok = await doCopyFromDraft();

      // flip label for ~1.5s
      if (!btn.dataset.origLabel) btn.dataset.origLabel = btn.innerHTML;
      btn.innerHTML = ok ? "Copied! ✓" : "Copy";
      setTimeout(() => {
        btn.innerHTML = btn.dataset.origLabel || "Copy";
      }, 1500);

      // announce
      live.textContent = ok ? "Copied to clipboard" : "Copy failed";
    };

    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, []);

  return null;
}
