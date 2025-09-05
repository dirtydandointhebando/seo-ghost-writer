const fs = require("fs");
const p = "app/page.jsx";
let s = fs.readFileSync(p, "utf8");

// 1) Remove any bad inline insertions like `{tab === 'schema' && <SchemaPanel />}`
// that may have landed inside your tab button map.
s = s.replace(/\n\s*\{?\s*tab\s*===\s*['"]schema['"]\s*&&\s*<SchemaPanel\s*\/>\s*\}?\s*\n/g, "\n");

// 2) Ensure SchemaPanel is imported
if (!s.includes('import SchemaPanel')) {
  s = s.replace(
    /(import\s+\{\s*useState\s*\}\s+from\s+"react";\s*\n)/,
    `$1import SchemaPanel from "@/app/components/SchemaPanel";\n`
  );
}

// 3) Make tabs array include "schema" so it renders a button with the same styles/handlers
s = s.replace(
  /\[\s*["']audit["']\s*,\s*["']topics["']\s*,\s*["']content["']\s*\]\.map\(/,
  `["audit","topics","content","schema"].map(`
);

// 4) Render <SchemaPanel /> in the content area using activeTab
if (!s.includes("<SchemaPanel")) {
  s = s.replace(
    /<\/main>/,
    `\n{activeTab === 'schema' && <SchemaPanel />}\n</main>`
  );
}

fs.writeFileSync(p, s);
console.log("patched:", p);
