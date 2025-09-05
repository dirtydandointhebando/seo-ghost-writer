"use client";
import { useEffect, useState } from "react";

/** CopyToast
 * Patches navigator.clipboard.writeText so ANY copy in the app
 * shows a bottom-right "Copied! ✓" toast (or "Copy failed").
 */
export default function CopyToast() {
  const [msg, setMsg] = useState("");
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!navigator?.clipboard?.writeText) return;
    const original = navigator.clipboard.writeText.bind(navigator.clipboard);

    navigator.clipboard.writeText = async (...args) => {
      try {
        const res = await original(...args);
        setMsg("Copied! ✓");
        setShow(true);
        setTimeout(() => setShow(false), 1500);
        return res;
      } catch (e) {
        console.error("Copy failed:", e);
        setMsg("Copy failed");
        setShow(true);
        setTimeout(() => setShow(false), 1500);
        throw e;
      }
    };

    // no cleanup needed for SPA; if you want, you can restore on unmount
  }, []);

  if (!show) return null;

  return (
    <div className="fixed right-4 bottom-4 z-50 pointer-events-none">
      <div className="rounded-xl border bg-white/90 backdrop-blur px-3 py-2 text-sm shadow">
        {msg}
      </div>
    </div>
  );
}
