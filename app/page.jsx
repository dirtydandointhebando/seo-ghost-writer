"use client";

import { useState } from "react";

import ThemeToggle from "@/app/components/ThemeToggle";
import SchemaPanel from "@/app/components/SchemaPanel";
function intentLabel(i){const m={informational:"Info",comparison:"Comparison",local:"Local",cost:"Cost",transactional:"Transactional"};return m[i]||"Info"}
function intentClass(i){switch(i){case "local":return "bg-blue-100 text-blue-800";case "comparison":return "bg-violet-100 text-violet-800";case "cost":return "bg-amber-100 text-amber-800";case "transactional":return "bg-emerald-100 text-emerald-800";default:return "bg-gray-100 text-gray-800"}}
import { buildRecommendations as buildRecs } from "@/lib/recommendations";

// Build a flexible list of SEO recs from the audit
function buildRecommendations(audit) {
  if (!audit) return [];
  const recs = [];
  // Meta & Head
  if (!audit.meta.titleFound) recs.push("Add a unique, descriptive <title> (about 50–60 characters).");
  else recs.push("Review <title> length/uniqueness across the site.");
  if (!audit.meta.descriptionFound) recs.push("Write a unique meta description (~155 characters) that matches searcher intent.");
  if (!audit.meta.canonicalFound) recs.push("Add a canonical link to prevent duplicate-content issues.");
  // Headings
  if (audit.headings.h1Count !== 1) recs.push("Use exactly one H1 per page (you have " + audit.headings.h1Count + ").");
  if (audit.headings.h2Count === 0) recs.push("Add H2 sections to structure content and target subtopics.");
  // Images
  if (audit.images.missingAlt > 0) recs.push(`Add alt text to  image(s) without descriptive alt.`);
  // Robots/Indexing
  if (audit.robots.metaNoindex) recs.push("Remove the noindex robots meta tag if this page should rank.");
  if (!audit.robots.robotsTxtFound) recs.push("Ensure a robots.txt exists and permits crawling of important paths.");
  // Schema
  if (!audit.schema.jsonldFound) recs.push("Add JSON-LD schema (e.g., Article / LocalBusiness / FAQ) where appropriate.");
  return recs;
}


export default function Home() {
  const [url, setUrl] = useState("");
  const [keywords, setKeywords] = useState("");
  const [about, setAbout] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
const [copied, setCopied] = useState(false);
async function handleCopyFrom(id){ try{ const el=document.getElementById(id); const text=el?el.innerText:""; await navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),1500);}catch(e){console.error(e);} }
const topicsList = Array.isArray(data?.topics) ? data.topics : [];
  const [activeTab, setActiveTab] = useState("audit");
  const [genType, setGenType] = useState("blog");
  const [genTopic, setGenTopic] = useState(null);
  const [genTone, setGenTone] = useState("Professional");
  const [genLength, setGenLength] = useState(800);
  const [cta, setCta] = useState("Book a consultation");
  const [interlink, setInterlink] = useState("");
  const [draft, setDraft] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [error, setError] = useState("");

  async function runAudit() {
    setError("");
    setLoading(true);
    setData(null);
    setDraft("");
    try {
      const res = await fetch("/api/run-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          keywords: keywords
            .split(",")
            .map(s => s.trim())
            .filter(Boolean)
            .slice(0, 3),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Audit failed");
      setData(json);
      setActiveTab("audit");
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function generate() {
    if (!genTopic) return;
    setGenLoading(true);
    setDraft("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          topic: genTopic.query,
          type: genType,
          tone: genTone,
          wordCount: Number(genLength),
          cta,
          interlink,
          about
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Generation failed");
      setDraft(json.html || json.text || "");
      setActiveTab("content");
    } catch (e) {
      alert(e.message || "Generation error");
    } finally {
      setGenLoading(false);
    }
  }

  function Badge({ children, ok, warn }) {
  const variant = ok ? "badge-ok" : (warn ? "badge-warn" : "badge-neutral");
  return <span className={`badge `}>{children}</span>;
}


{/* SCHEMA_PANEL_INJECTED */}
{(() => {
  try {
    const t = (typeof activeTab !== 'undefined' ? activeTab : (typeof tab !== 'undefined' ? tab : null));
    return t === 'schema' ? <div className="mt-6"><SchemaPanel /></div> : null;
  } catch { return null; }
})()}
