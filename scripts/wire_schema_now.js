const fs=require("fs"); const p="app/page.jsx"; let s=fs.readFileSync(p,"utf8");

// remove any leftover /schema link
s=s.replace(/<a[^>]*href="\/schema"[^>]*>\s*Schema\s*<\/a>\s*/g,"");

// import component
if(!s.includes('import SchemaPanel')) s=s.replace(/(import\s+\{\s*useState\s*\}\s+from\s+"react";\s*\n)/, `$1import SchemaPanel from "@/app/components/SchemaPanel";\n`);

// ensure schema in tabs
s=s.replace(/\[\s*['"]audit['"]\s*,\s*['"]topics['"]\s*,\s*['"]content['"]\s*\]\.map\(/, `["audit","topics","content","schema"].map(`);

// render panel when activeTab === 'schema'
if(!s.includes("<SchemaPanel")) {
  // inject after content panel if we can find it
  let out=s.replace(/(\{[^\n]*activeTab\s*===\s*['"]content['"][\s\S]*?\}\s*\n)/,
    `$1{activeTab === 'schema' && <SchemaPanel />}\n`);
  if(out===s) out=s.replace(/<\/main>/, `\n{activeTab === 'schema' && <SchemaPanel />}\n</main>`);
  s=out;
}

fs.writeFileSync(p,s); console.log("patched:",p);
