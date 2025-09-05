const fs = require("fs");

function patchFile(path, transform) {
  const src = fs.readFileSync(path, "utf8");
  const out = transform(src);
  if (out !== src) {
    fs.writeFileSync(path, out);
    console.log("patched:", path);
  } else {
    console.log("no changes:", path);
  }
}

// ---- app/page.jsx: intent helpers + badge + Schema tab ----
patchFile("app/page.jsx", (s) => {
  let out = s;

  // 1) Add helpers once (after React import if not present)
  if (!/function intentLabel\(/.test(out)) {
    out = out.replace(
      /(import\s+\{\s*useState\s*\}\s+from\s+"react";\s*\n)/,
      `$1
function intentLabel(i){const m={informational:"Info",comparison:"Comparison",local:"Local",cost:"Cost",transactional:"Transactional"};return m[i]||"Info"}
function intentClass(i){switch(i){case "local":return "bg-blue-100 text-blue-800";case "comparison":return "bg-violet-100 text-violet-800";case "cost":return "bg-amber-100 text-amber-800";case "transactional":return "bg-emerald-100 text-emerald-800";default:return "bg-gray-100 text-gray-800"}}
`
    );
  }

  // 2) Inject badge next to any {...query}
  out = out.replace(
    /\{\s*([A-Za-z_]\w*)\.query\s*\}/g,
    `<span className="mr-2">{$1.query}</span><span className={\`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium \${intentClass($1.intent)}\`}>{intentLabel($1.intent)}</span>`
  );

  // 3) Add Schema tab link after the Content tab button (first occurrence)
  if (!/href="\/schema"/.test(out)) {
    out = out.replace(
      /(<button[^>]*>\s*Content\s*<\/button>)/,
      `$1
            <a href="/schema" className="rounded-xl border px-3 py-2">Schema</a>`
    );
  }

  return out;
});

// ---- app/schema/page.jsx: add tab bar with Schema active ----
patchFile("app/schema/page.jsx", (s) => {
  let out = s;
  if (!/>\s*Schema\s*<\/button>/.test(out)) {
    out = out.replace(
      /(<main[^>]*className="[^"]*p-6[^"]*"\s*>)/,
      `$1
      <div className="flex gap-2 mb-4">
        <a href="/" className="rounded-xl border px-3 py-2">Audit</a>
        <a href="/" className="rounded-xl border px-3 py-2">Topics</a>
        <a href="/" className="rounded-xl border px-3 py-2">Content</a>
        <button className="rounded-xl px-3 py-2 bg-neutral-900 text-white">Schema</button>
      </div>`
    );
  }
  return out;
});
