const fs = require("fs");
const p = "app/page.jsx";
let s = fs.readFileSync(p, "utf8");

// 1) Remove any leftover <a href="/schema">Schema</a> links
s = s.replace(/<a[^>]*href="\/schema"[^>]*>\s*Schema\s*<\/a>\s*/g, "");

// 2) Ensure import
if (!s.includes('import SchemaPanel')) {
  s = s.replace(/(import\s+\{\s*useState\s*\}\s+from\s+"react";\s*\n)/,
    `$1import SchemaPanel from "@/app/components/SchemaPanel";\n`);
}

// 3) Ensure the tabs array includes "schema" so it's a real button (once)
s = s.replace(
  /\[\s*['"]audit['"]\s*,\s*['"]topics['"]\s*,\s*['"]content['"]\s*\]\.map\(/,
  `["audit","topics","content","schema"].map(`
);

// 4) Render the schema panel in the content area (once)
if (!s.includes("<SchemaPanel")) {
  s = s.replace(/<\/main>/, `\n{activeTab === 'schema' && <SchemaPanel />}\n</main>`);
}

fs.writeFileSync(p, s);
console.log("patched:", p);
