const fs = require("fs");
const p = "app/page.jsx";
let s = fs.readFileSync(p, "utf8");

// 0) Ensure import
if (!s.includes('import SchemaPanel')) {
  s = s.replace(/(import\s+\{\s*useState\s*\}\s+from\s+"react";\s*\n)/,
    `$1import SchemaPanel from "@/app/components/SchemaPanel";\n`);
}

// 1) Remove any prior injected force block
s = s.replace(/\{\s*\/\* SCHEMA_PANEL_INJECTED \*\/[\s\S]*?\}\)\(\)\}\s*\}\s*\n?/g, "");
s = s.replace(/\{\/\* FORCE_SCHEMA_TEST \*\/[\s\S]*?<\/main>/, "</main>");

// 2) Replace a minimal `{activeTab === 'schema' && <SchemaPanel />}` with a fuller container
const mini = /\{activeTab\s*===\s*['"]schema['"]\s*&&\s*<SchemaPanel\s*\/>\s*\}/;
const full = `{activeTab === 'schema' && (
  <div className="rounded-2xl border p-4 mt-4">
    <h2 className="text-lg font-semibold mb-3">Schema Generator</h2>
    <SchemaPanel />
  </div>
)}`;

if (mini.test(s)) {
  s = s.replace(mini, full);
} else {
  // 3) If we can't find the mini version, inject the full block right after the content pane
  s = s.replace(
    /(\{activeTab\s*===\s*["']content["']\s*&&[\s\S]*?\}\s*\)\s*\})/,
    `$1\n\n${full}\n`
  );
}

fs.writeFileSync(p, s);
console.log("patched:", p);
