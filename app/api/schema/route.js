import { NextResponse } from "next/server";
import { faqSchema, articleSchema, businessSchema } from "@/lib/schema";

export async function POST(req){
  try{
    const body = await req.json();
    const type = (body.type||"business").toLowerCase();

    if(type==="faq"){
      const qas = (body.faqText||"")
        .split(/\n{2,}/)
        .map(b=>{
          const lines=b.trim().split(/\n/);
          const q=(lines[0]||"").replace(/^Q:\s*/i,"").trim();
          const a=lines.slice(1).join(" ").replace(/^A:\s*/i,"").trim();
          return q && a ? [q,a] : null;
        }).filter(Boolean);
      return NextResponse.json({ jsonld: faqSchema({ url: body.url||"", items: qas }) });
    }

    if(type==="article"){
      const keywords=(body.keywords||"").split(/\s*,\s*/).filter(Boolean);
      return NextResponse.json({ jsonld: articleSchema({
        headline: body.headline||"",
        url: body.url||"",
        author: body.author||"Staff",
        image: body.image||"",
        keywords,
        about: body.about||""
      })});
    }

    // business (LocalBusiness & specific subtypes)
    return NextResponse.json({ jsonld: businessSchema(body) });
  }catch(e){
    return NextResponse.json({ error: e.message||"Invalid request" }, { status: 400 });
  }
}
