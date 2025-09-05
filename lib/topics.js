function uniq(arr) {
  return Array.from(new Set(arr.filter(Boolean)));
}

export function suggestTopicsFromKeywords(keywords = [], pageTitle = "") {
  const seeds = keywords.length ? keywords : (pageTitle ? [pageTitle] : []);
  const templates = [
    "cost of {kw}",
    "what is {kw}",
    "{kw} vs alternatives",
    "how to choose {kw}",
    "best {kw} in 2025",
    "is {kw} worth it",
    "{kw} checklist",
    "{kw} mistakes to avoid",
    "DIY {kw} vs hiring a pro",
    "{kw} near me (local intent)"
  ];

  const out = [];
  let i = 0;
  seeds.slice(0, 3).forEach(kw => {
    templates.forEach(t => {
      const q = t.replace("{kw}", kw).replace(/\s+/g, " ").trim();
      out.push({ id: `t${i++}`, query: q, source: "bootstrap" });
    });
  });

  return uniq(out.map(o => o.query)).slice(0, 10).map((q, idx) => ({
    id: `t${idx}`,
    query: q,
    source: "bootstrap"
  }));
}
