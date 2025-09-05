const fs = require("fs");
const p = "app/page.jsx";
let s = fs.readFileSync(p, "utf8");

// 0) kill leftover link-style Schema
s = s.replace(/<a[^>]*href="\/schema"[^>]*>\s*Schema\s*<\/a>\s*/g, "");

// 1) import SchemaPanel once
if (!s.includes('import SchemaPanel')) {
  s = s.replace(/(import\s+\{\s*useState\s*\}\s+from\s+"react";\s*\n)/,
    `$1import SchemaPanel from "@/app/components/SchemaPanel";\n`);
}

// 2) include "schema" in the tabs array (once)
s = s.replace(
  /\[\s*(['"])audit\1\s*,\s*\1topics\1\s*,\s*\1content\1\s*\]\.map\(/,
  `["audit","topics","content","schema"].map(`
);

// 3) render SchemaPanel after the Content panel
if (!s.includes("<SchemaPanel")) {
  // try to inject right after the content panel condition
  let out = s.replace(
    /(\{[^\n]*activeTab\s*===\s*['"]content['"][\s\S]*?\}\s*\n)/,
    `$1{activeTab === 'schema' && <SchemaPanel />}\n`
  );
  if (out === s) {
    // fallback: append before closing </main>
    out = s.replace(/<\/main>/, `\n{activeTab === 'schema' && <SchemaPanel />}\n</main>`);
  }
  s = out;
}

fs.writeFileSync(p, s);
console.log("patched:", p);
