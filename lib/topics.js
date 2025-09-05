function uniq(arr) { return Array.from(new Set(arr.filter(Boolean))); }

export async function googleSuggest(q, { hl = "en" } = {}) {
  const url = `https://suggestqueries.google.com/complete/search?client=chrome&hl=${hl}&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" });
  if (!res.ok) throw new Error("suggest fetch failed");
  const data = await res.json(); // [query, [suggestions...], ...]
  return Array.isArray(data?.[1]) ? data[1] : [];
}

function classifyIntent(q) {
  const s = q.toLowerCase();
  if (/near me|in [a-z ]+$/.test(s)) return "local";
  if (/vs|versus|compare/.test(s)) return "comparison";
  if (/cost|price|pricing|rates?/.test(s)) return "cost";
  if (/how|what|why|when|can|should|guide|tips|checklist/.test(s)) return "informational";
  if (/buy|hire|service|provider|book|consult/.test(s)) return "transactional";
  return "informational";
}

function scoreQuery(q, seed) {
  const s = q.toLowerCase();
  let score = 0;
  // contains seed words
  seed.split(/\s+/).forEach(w => { if (w && s.includes(w.toLowerCase())) score += 2; });
  // question words
  if (/^how|^what|^why|^when|^can|checklist|tips/.test(s)) score += 3;
  // high-intent patterns
  if (/near me|in [a-z ]+$/.test(s)) score += 3;
  if (/cost|price|pricing|rates?/.test(s)) score += 3;
  if (/vs|versus|compare/.test(s)) score += 2;
  // reasonable length
  const wc = q.trim().split(/\s+/).length;
  if (wc >= 3 && wc <= 9) score += 2;
  return score;
}

function bootstrapTopics(keywords = [], pageTitle = "") {
  const seeds = keywords.length ? keywords : (pageTitle ? [pageTitle] : []);
  const templates = [
    "cost of {kw}", "what is {kw}", "{kw} vs alternatives", "how to choose {kw}",
    "best {kw} in 2025", "is {kw} worth it", "{kw} checklist",
    "{kw} mistakes to avoid", "DIY {kw} vs hiring a pro", "{kw} near me"
  ];
  const out = [];
  let i = 0;
  seeds.slice(0,3).forEach(kw => {
    templates.forEach(t => out.push({ id:`t${i++}`, query: t.replace("{kw}", kw), source:"bootstrap", intent:"informational", score: 1 }));
  });
  return out.slice(0,10);
}

export async function suggestTopicsFromKeywords(keywords = [], pageTitle = "") {
  const seeds = (keywords.length ? keywords : (pageTitle ? [pageTitle] : [])).slice(0,3);
  const prefixes = ["", "how", "what", "why", "when", "can", "cost", "near me", "vs", "best", "checklist"];
  const bag = new Map(); // query -> {score,intent,source}

  for (const kw of seeds) {
    for (const p of prefixes) {
      const q = p ? `${p} ${kw}` : kw;
      try {
        const list = await googleSuggest(q);
        for (const s of list) {
          const key = s.trim();
          if (!key) continue;
          const intent = classifyIntent(key);
          const score = scoreQuery(key, kw);
          const prev = bag.get(key);
          const next = { intent, score: (prev?.score || 0) + score, source: "google-suggest" };
          bag.set(key, next);
        }
      } catch {}
    }
  }

  const items = Array.from(bag.entries())
    .map(([query, meta], i) => ({ id:`t${i}`, query, intent: meta.intent, score: meta.score, source: meta.source }))
    .sort((a,b) => b.score - a.score)
    .slice(0, 10);

  return items.length ? items : bootstrapTopics(keywords, pageTitle);
}
