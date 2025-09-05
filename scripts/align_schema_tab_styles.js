const fs = require("fs");

function read(p){ return fs.readFileSync(p,"utf8"); }
function write(p,s){ fs.writeFileSync(p,s); console.log("patched:", p); }

const home = "app/page.jsx";
const schema = "app/schema/page.jsx";

// get the exact className used by the Content tab on the home page
let homeSrc = read(home);
let contentClass = "rounded-xl border px-3 py-2";
{
  const m = homeSrc.match(/<button[^>]*className="([^"]*)"[^>]*>\s*Content\s*<\/button>/);
  if (m) contentClass = m[1];
}

// 1) On home page: set Schema link class to match Content tab exactly
{
  const before = homeSrc;
  homeSrc = homeSrc.replace(
    /(<a\s+href="\/schema"\s+className=")[^"]*(">Schema<\/a>)/,
    `$1${contentClass}$2`
  );
  if (homeSrc !== before) write(home, homeSrc); else console.log("no changes:", home);
}

// 2) On /schema page: make Audit/Topics/Content inactive tabs = contentClass,
//    and make Schema (active) = contentClass + active accents
let schemaSrc = read(schema);
{
  const inactive = contentClass;
  const active = `${contentClass} bg-neutral-900 text-white`;

  let out = schemaSrc;
  out = out.replace(/(<a\s+href="\/"\s+className=")[^"]*(">Audit<\/a>)/, `$1${inactive}$2`);
  out = out.replace(/(<a\s+href="\/"\s+className=")[^"]*(">Topics<\/a>)/, `$1${inactive}$2`);
  out = out.replace(/(<a\s+href="\/"\s+className=")[^"]*(">Content<\/a>)/, `$1${inactive}$2`);
  out = out.replace(/(<button[^>]*>\s*Schema\s*<\/button>)/, `<button className="${active}">Schema</button>`);

  if (out !== schemaSrc) { write(schema, out); } else { console.log("no changes:", schema); }
}
