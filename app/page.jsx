"use client";

import { useState } from "react";

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

  function Badge({ ok, warn, children }) {
    const cls = ok ? "badge badge-ok" : warn ? "badge badge-warn" : "badge badge-err";
    return <span className={cls}>{children}</span>;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">SEO Content Planner</h1>
        <p className="text-gray-600">Stop guessing. Audit your page, find topics, and generate content.</p>
      </header>

      <section className="card space-y-4">
        <div className="grid gap-3 md:grid-cols-[2fr,2fr,auto]">
          <input
            className="rounded-xl border p-3"
            placeholder="https://your-site.com/page"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <input
            className="rounded-xl border p-3"
            placeholder="Keywords/services (comma separated, optional)"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
          />
          <button
            onClick={runAudit}
            disabled={loading || !url}
            className="rounded-xl bg-gray-900 text-white px-4 py-3 disabled:opacity-50"
          >
            {loading ? "Running..." : "Run Audit"}
          </button>
        </div>
        <textarea className="rounded-xl border p-3 w-full" rows="3" placeholder="About us / unique value (optional). E.g., niche expertise, service area, certifications, guarantees." value={about} onChange={e=>setAbout(e.target.value)} />
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </section>

      {data && (
        <section className="card space-y-4">
          <div className="flex gap-2">
            {["audit","topics","content","schema"].map(t => (
              <button key={t}
                onClick={() => setActiveTab(t)}
                className={`tab ${activeTab===t ? "tab-active" : "tab-inactive"}`}>
                {t[0].toUpperCase()+t.slice(1)}
              </button>
            ))}
          
        </div>

          {activeTab === "audit" && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">On‑Page SEO Audit</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 space-y-2">
                  <h3 className="font-medium">Meta & Head</h3>
                  <div className="space-x-2">
                    <Badge ok={data.audit.meta.titleFound}>Title</Badge>
                    <Badge ok={data.audit.meta.descriptionFound}>Meta description</Badge>
                    <Badge ok={data.audit.meta.canonicalFound} warn={!data.audit.meta.canonicalFound}>Canonical</Badge>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 space-y-2">
                  <h3 className="font-medium">Headings</h3>
                  <div className="space-x-2">
                    <Badge ok={data.audit.headings.h1Count===1} warn={data.audit.headings.h1Count===0 || data.audit.headings.h1Count>1}>
                      H1 count: {data.audit.headings.h1Count}
                    </Badge>
                    <Badge ok={data.audit.headings.h2Count>0} warn={data.audit.headings.h2Count===0}>
                      H2 count: {data.audit.headings.h2Count}
                    </Badge>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 space-y-2">
                  <h3 className="font-medium">Images</h3>
                  <div className="space-x-2">
                    <Badge ok={data.audit.images.missingAlt===0} warn={data.audit.images.missingAlt>0}>
                      Missing alt: {data.audit.images.missingAlt} / {data.audit.images.total}
                    </Badge>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 space-y-2">
                  <h3 className="font-medium">Robots & Schema</h3>
                  <div className="space-x-2">
                    <Badge ok={data.audit.robots.robotsTxtFound}>robots.txt</Badge>
                    <Badge ok={!data.audit.robots.metaNoindex} warn={data.audit.robots.metaNoindex}>noindex</Badge>
                    <Badge ok={data.audit.schema.jsonldFound} warn={!data.audit.schema.jsonldFound}>JSON‑LD</Badge>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
  <h3 className="font-semibold text-base">Recommendations</h3>
  <ul className="list-disc ml-5 text-sm text-gray-700 space-y-1">{buildRecs(data.audit, about).map((r, i) => (<li key={i}><span className="font-medium">{r.rec}</span> <span className="text-gray-600">— {r.why}</span></li>))}</ul>
</div>
            </div>
          )}

          {activeTab === "topics" && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">Suggested Topics</h2>
              {topicsList.length === 0 ? (
  <p className="text-sm text-gray-600">No topic suggestions found. Try broader keywords or a different seed.</p>
) : (
  <ul className="space-y-2">
                {topicsList.map((t) => (
                  <li key={t.id} className="flex items-center justify-between rounded-xl border p-3 bg-white">
                    <div className="flex flex-col">
                      <span className="font-medium"><span className="mr-2">{t.query}</span><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${intentClass(t.intent)}`}>{intentLabel(t.intent)}</span></span>
                      <span className="text-xs text-gray-500">source: {t.source}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setGenType("blog"); setGenTopic(t); setActiveTab("content"); }}
                        className="rounded-lg bg-gray-900 text-white px-3 py-2 text-sm"
                      >
                        Generate Blog
                      </button>
                      <button
                        onClick={() => { setGenType("service"); setGenTopic(t); setActiveTab("content"); }}
                        className="rounded-lg bg-gray-100 text-gray-900 px-3 py-2 text-sm"
                      >
                        Generate Service Page
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
)}
            </div>
          )}

          {activeTab === "content" && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">Content Generator</h2>
              {!genTopic && <p className="text-sm text-gray-600">Pick a topic in the Topics tab to start.</p>}
{genTopic && (
                <div className="space-y-3">
                  <div className="grid md:grid-cols-4 gap-3">
                    <select className="rounded-xl border p-3" value={genType} onChange={e=>setGenType(e.target.value)}>
                      <option value="blog">Blog</option>
                      <option value="service">Service Page</option>
                    </select>
                    <select className="rounded-xl border p-3" value={genTone} onChange={e=>setGenTone(e.target.value)}>
                      <option>Professional</option>
                      <option>Casual</option>
                      <option>Friendly</option>
                    </select>
                    <select className="rounded-xl border p-3" value={genLength} onChange={e=>setGenLength(e.target.value)}>
                      <option value={600}>600 words</option>
                      <option value={800}>800 words</option>
                      <option value={1200}>1200 words</option>
                    </select>
                    <input className="rounded-xl border p-3" placeholder="CTA (e.g., Book a consultation)"
                      value={cta} onChange={e=>setCta(e.target.value)} />
                  </div>
                  <input className="rounded-xl border p-3 w-full" placeholder="Interlink target URL (optional)"
                    value={interlink} onChange={e=>setInterlink(e.target.value)} />
                  {!about && (<textarea className="rounded-xl border p-3 w-full" rows="3" placeholder="About us / unique value (optional)" value={about} onChange={e=>setAbout(e.target.value)} />)}
                  <button
                    onClick={generate}
                    disabled={genLoading || !genTopic}
                    className="rounded-xl bg-gray-900 text-white px-4 py-3 disabled:opacity-50"
                  >
                    {genLoading ? "Generating..." : `Generate ${genType === "blog" ? "Blog" : "Service Page"}`}
                  </button>

                  {draft && (
                    <div className="space-y-2">
                      <textarea className="codegen" value={draft} onChange={()=>{}} readOnly />
                      <button
                        onClick={() => navigator.clipboard.writeText(draft)}
                        className="rounded-lg bg-gray-100 px-3 py-2 text-sm"
                      >
                        Copy to Clipboard
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
{/* SCHEMA PANE (final) */}
{activeTab === "schema" && (
  <div className="rounded-2xl border p-4 mt-4">
    <h2 className="text-lg font-semibold mb-3">Schema Generator</h2>
    <SchemaInline />
  </div>
)}

        
{/* Schema Tab */}
{activeTab === "schema" && (
  <div className="rounded-2xl border p-4 mt-4">
    <h2 className="text-lg font-semibold mb-3">Schema Generator</h2>
    <SchemaInline />
  </div>
)}
</section>
      )}
    </div>
  );
}

{/* SCHEMA_PANEL_INJECTED */}
{(() => {
  try {
    const t = (typeof activeTab !== 'undefined' ? activeTab : (typeof tab !== 'undefined' ? tab : null));
    return t === 'schema' ? <div className="mt-6"><SchemaPanel /></div> : null;
  } catch { return null; }
})()}

// --- inline Schema generator (kept tiny on purpose)
function SchemaInline() {
  const [mode, setMode] = useState("business");
  const [out, setOut] = useState("");

  // shared
  const [url, setUrl] = useState("");

  // business
  const [bizType, setBizType] = useState("LocalBusiness");
  const [name, setName] = useState("");
  const [telephone, setTelephone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postal, setPostal] = useState("");
  const [country, setCountry] = useState("");
  const [hours, setHours] = useState("Mo-Fr 09:00-17:00");
  const [sameAs, setSameAs] = useState("");

  // faq
  const [faqText, setFaqText] = useState("Q: Example?\nA: Example.");

  // article
  const [headline, setHeadline] = useState("");
  const [author, setAuthor] = useState("");

  const csv = (s) => (s || "").split(/\s*,\s*/).filter(Boolean);

  function generate() {
    let jsonld;

    if (mode === "faq") {
      const items = (faqText || "")
        .split(/\n{2,}/)
        .map((block) => {
          const [first, ...rest] = block.trim().split(/\n/);
          const q = (first || "").replace(/^Q:\s*/i, "").trim();
          const a = (rest.join(" ") || "").replace(/^A:\s*/i, "").trim();
          return q && a
            ? { "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } }
            : null;
        })
        .filter(Boolean);
      jsonld = { "@context": "https://schema.org", "@type": "FAQPage", ...(url ? { url } : {}), mainEntity: items };
    } else if (mode === "article") {
      const now = new Date().toISOString();
      jsonld = {
        "@context": "https://schema.org",
        "@type": "Article",
        ...(url ? { url } : {}),
        ...(headline ? { headline } : {}),
        ...(author ? { author: { "@type": "Person", name: author } } : {}),
        datePublished: now,
        dateModified: now,
      };
    } else {
      jsonld = {
        "@context": "https://schema.org",
        "@type": bizType || "LocalBusiness",
        ...(name ? { name } : {}),
        ...(url ? { url } : {}),
        ...(telephone ? { telephone } : {}),
        address: {
          "@type": "PostalAddress",
          ...(street ? { streetAddress: street } : {}),
          ...(city ? { addressLocality: city } : {}),
          ...(region ? { addressRegion: region } : {}),
          ...(postal ? { postalCode: postal } : {}),
          ...(country ? { addressCountry: country } : {}),
        },
        ...(hours ? { openingHours: hours } : {}),
        ...(sameAs ? { sameAs: csv(sameAs) } : {}),
      };
    }

    setOut(`<script type="application/ld+json">\n${JSON.stringify(jsonld, null, 2)}\n</script>`);
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button onClick={() => setMode("business")} className={`rounded-xl px-3 py-2 ${mode==="business"?"bg-neutral-900 text-white":"border"}`}>Business</button>
        <button onClick={() => setMode("faq")} className={`rounded-xl px-3 py-2 ${mode==="faq"?"bg-neutral-900 text-white":"border"}`}>FAQ</button>
        <button onClick={() => setMode("article")} className={`rounded-xl px-3 py-2 ${mode==="article"?"bg-neutral-900 text-white":"border"}`}>Article</button>
      </div>

      <div className="grid gap-3">
        <label className="text-sm text-gray-700">Page URL (optional)</label>
        <input className="rounded-xl border p-2" placeholder="https://example.com/page" value={url} onChange={e=>setUrl(e.target.value)} />
      </div>

      {mode==="business" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select className="rounded-xl border p-2" value={bizType} onChange={e=>setBizType(e.target.value)}>
            {["LocalBusiness","ProfessionalService","LegalService","HomeAndConstructionBusiness","MedicalBusiness","Store","Restaurant"].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input className="rounded-xl border p-2" placeholder="Business Name" value={name} onChange={e=>setName(e.target.value)} />
          <input className="rounded-xl border p-2" placeholder="Phone (+1-555-555-5555)" value={telephone} onChange={e=>setTelephone(e.target.value)} />
          <input className="rounded-xl border p-2 md:col-span-2" placeholder="Street" value={street} onChange={e=>setStreet(e.target.value)} />
          <input className="rounded-xl border p-2" placeholder="City" value={city} onChange={e=>setCity(e.target.value)} />
          <input className="rounded-xl border p-2" placeholder="Region/State" value={region} onChange={e=>setRegion(e.target.value)} />
          <input className="rounded-xl border p-2" placeholder="Postal Code" value={postal} onChange={e=>setPostal(e.target.value)} />
          <input className="rounded-xl border p-2" placeholder="Country (US, CA…)" value={country} onChange={e=>setCountry(e.target.value)} />
          <input className="rounded-xl border p-2 md:col-span-2" placeholder="Hours (e.g., Mo-Fr 09:00-17:00)" value={hours} onChange={e=>setHours(e.target.value)} />
          <input className="rounded-xl border p-2 md:col-span-2" placeholder="SameAs URLs (comma-separated)" value={sameAs} onChange={e=>setSameAs(e.target.value)} />
        </div>
      )}

      {mode==="faq" && (
        <div className="grid gap-3">
          <label className="text-sm text-gray-700">Q & A (blank line between pairs)</label>
          <textarea className="rounded-xl border p-3" rows={7} value={faqText} onChange={e=>setFaqText(e.target.value)} />
        </div>
      )}

      {mode==="article" && (
        <div className="grid gap-3">
          <input className="rounded-xl border p-2" placeholder="Headline" value={headline} onChange={e=>setHeadline(e.target.value)} />
          <input className="rounded-xl border p-2" placeholder="Author" value={author} onChange={e=>setAuthor(e.target.value)} />
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={generate} className="rounded-xl border px-4 py-2">Generate Schema</button>
        {out && <button onClick={()=>navigator.clipboard.writeText(out).catch(()=>{})}

className="rounded-xl border px-4 py-2">Copy</button>}
      </div>

      {out && <pre className="rounded-xl border p-3 overflow-auto text-sm whitespace-pre-wrap">{out}</pre>}
    </div>
  );
}
// --- end inline Schema generator