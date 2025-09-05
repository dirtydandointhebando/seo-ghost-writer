const fs = require("fs");
const p = "app/page.jsx";
let s = fs.readFileSync(p, "utf8");

// already present?
if (s.includes('href="/schema"')) {
  console.log("Schema tab already present");
  process.exit(0);
}

// Try after a <button>Content</button>
let out = s.replace(
  /(<button[^>]*>\s*Content\s*<\/button>)/,
  `$1
            <a href="/schema" className="rounded-xl border px-3 py-2">Schema</a>`
);

// If nothing changed, try after an <a>Content</a>
if (out === s) {
  out = s.replace(
    /(<a[^>]*>\s*Content\s*<\/a>)/,
    `$1
            <a href="/schema" className="rounded-xl border px-3 py-2">Schema</a>`
  );
}

// If still nothing, try to append Schema into the first tab strip (flex gap-2)
if (out === s) {
  out = s.replace(
    /(<div[^>]*className="[^"]*\bflex\b[^"]*\bgap-2\b[^"]*"[^>]*>)([\s\S]*?)(<\/div>)/,
    (_, open, inner, close) =>
      `${open}${inner}
        <a href="/schema" className="rounded-xl border px-3 py-2">Schema</a>
      ${close}`
  );
}

if (out !== s) {
  fs.writeFileSync(p, out);
  console.log("patched:", p);
} else {
  console.log("No matching tab markup found. Schema tab not inserted.");
  process.exit(1);
}
