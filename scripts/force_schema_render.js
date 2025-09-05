const fs = require("fs");
const p = "app/page.jsx";
let s = fs.readFileSync(p, "utf8");

// import once
if (!s.includes('import SchemaPanel')) {
  s = s.replace(/(import\s+\{\s*useState\s*\}\s+from\s+"react";\s*\n)/,
    `$1import SchemaPanel from "@/app/components/SchemaPanel";\n`);
}

// add render block near end of <main> (idempotent)
if (!s.includes("SCHEMA_PANEL_INJECTED")) {
  const block = `
{/* SCHEMA_PANEL_INJECTED */}
{(() => {
  try {
    const t = (typeof activeTab !== 'undefined' ? activeTab : (typeof tab !== 'undefined' ? tab : null));
    return t === 'schema' ? <div className="mt-6"><SchemaPanel /></div> : null;
  } catch { return null; }
})()}
`;
  if (s.includes("</main>")) {
    s = s.replace(/<\/main>/, block + "\n</main>");
  } else {
    s = s + block;
  }
}

fs.writeFileSync(p, s);
console.log("patched:", p);
