const fs = require("fs");
const p = "app/page.jsx";
let s = fs.readFileSync(p, "utf8");

// import the component once
if (!s.includes('import SchemaPanel')) {
  s = s.replace(/(import\s+.*from\s+"react";\s*\n)/, `$1import SchemaPanel from "@/app/components/SchemaPanel";\n`);
}

// grab Content tab's onClick and className to mirror behavior/style
const btnMatch = s.match(/<button[^>]*onClick=\{([^}]*)\}[^>]*className="([^"]*)"[^>]*>\s*Content\s*<\/button>/);
if (btnMatch) {
  const onClickContent = btnMatch[1];
  const classContent   = btnMatch[2];
  const onClickSchema  = onClickContent.replace(/(['"])content\1/g, "$1schema$1");

  // replace link Schema → button Schema (same style & handler)
  s = s.replace(/<a\s+href="\/schema"[^>]*>Schema<\/a>/, `<button onClick={${onClickSchema}} className="${classContent}">Schema</button>`);
}

// render Schema panel when tab is 'schema' (we try to inject right after Content panel condition)
if (!s.includes("<SchemaPanel")) {
  // try common patterns
  let injected = false;

  // pattern 1: {tab === 'content' && ...}
  s = s.replace(/\{[^}]*(['"])content\1[^}]*\}\s*\n/, (m) => {
    injected = true;
    return m + `\n{tab === 'schema' && <SchemaPanel />}\n`;
  });

  // pattern 2: activeTab === "content"
  if (!injected) {
    s = s.replace(/\{[^}]*active[^}]*(['"])content\1[^}]*\}\s*\n/, (m) => {
      injected = true;
      return m + `\n{activeTab === 'schema' && <SchemaPanel />}\n`;
    });
  }

  // fallback: append once near end of main container
  if (!injected) {
    s = s.replace(/<\/main>/, `\n{(typeof tab!=="undefined" ? tab==="schema" : (typeof activeTab!=="undefined" ? activeTab==="schema" : false)) && <SchemaPanel />}\n</main>`);
  }
}

fs.writeFileSync(p, s);
console.log("patched:", p);
