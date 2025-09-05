const fs=require("fs");
const p="app/page.jsx";
let s=fs.readFileSync(p,"utf8");
if(!/href="\/schema"/.test(s)){
  s=s.replace(/(<button[^>]*>\s*Content\s*<\/button>)/,
    `$1
            <a href="/schema" className="rounded-xl border px-3 py-2">Schema</a>`);
  fs.writeFileSync(p,s);
  console.log("patched:",p);
}else{
  console.log("no changes:",p);
}
