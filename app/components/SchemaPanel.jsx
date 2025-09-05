"use client";
import { useState } from "react";

function csv(str){return (str||"").split(/\s*,\s*/).filter(Boolean)}
function clean(o){return Object.fromEntries(Object.entries(o).filter(([_,v])=>!(v===""||v==null||(Array.isArray(v)&&!v.length))))}

function buildFAQ({url, faqText}){
  const items=(faqText||"").split(/\n{2,}/).map(b=>{
    const [first,...rest]=b.trim().split(/\n/);
    const q=(first||"").replace(/^Q:\s*/i,"").trim();
    const a=(rest.join(" ")||"").replace(/^A:\s*/i,"").trim();
    return q&&a?{ "@type":"Question", name:q, acceptedAnswer:{ "@type":"Answer", text:a }}:null;
  }).filter(Boolean);
  const s={ "@context":"https://schema.org", "@type":"FAQPage", mainEntity:items };
  if(url) s.url=url;
  return s;
}

function buildArticle({headline,url,author,image,keywords,about}){
  const now=new Date().toISOString();
  return clean({
    "@context":"https://schema.org","@type":"Article",headline,url,
    author: author?{ "@type":"Person", name:author }:undefined,
    image, keywords: csv(keywords), about, datePublished:now, dateModified:now
  });
}

function buildBusiness(p){
  const type=p.businessType||"LocalBusiness";
  const address=clean({
    "@type":"PostalAddress",
    streetAddress:p.street, addressLocality:p.locality, addressRegion:p.region,
    postalCode:p.postalCode, addressCountry:p.country
  });
  const s=clean({
    "@context":"https://schema.org","@type":type,name:p.name,url:p.url,
    telephone:p.telephone,email:p.email,description:p.description,priceRange:p.priceRange,
    areaServed:p.areaServed,image:p.image,logo:p.logo,address,
    openingHours:p.hours, sameAs: csv(p.sameAs)
  });
  if(p.latitude && p.longitude){
    s.geo={ "@type":"GeoCoordinates", latitude:Number(p.latitude), longitude:Number(p.longitude) };
  }
  return s;
}

export default function SchemaPanel(){
  const [mode,setMode]=useState("business");
  const [out,setOut]=useState("");

  // shared
  const [url,setUrl]=useState("");

  // business
  const [businessType,setBusinessType]=useState("LocalBusiness");
  const [name,setName]=useState(""); const [telephone,setTelephone]=useState("");
  const [email,setEmail]=useState(""); const [street,setStreet]=useState("");
  const [locality,setLocality]=useState(""); const [region,setRegion]=useState("");
  const [postalCode,setPostalCode]=useState(""); const [country,setCountry]=useState("");
  const [description,setDescription]=useState(""); const [areaServed,setAreaServed]=useState("");
  const [priceRange,setPriceRange]=useState(""); const [hours,setHours]=useState("Mo-Fr 09:00-17:00");
  const [latitude,setLatitude]=useState(""); const [longitude,setLongitude]=useState("");
  const [logo,setLogo]=useState(""); const [image,setImage]=useState(""); const [sameAs,setSameAs]=useState("");

  // faq
  const [faqText,setFaqText]=useState("Q: Example question?\nA: Example answer.");

  // article
  const [headline,setHeadline]=useState(""); const [author,setAuthor]=useState("");
  const [artImage,setArtImage]=useState(""); const [keywords,setKeywords]=useState("");
  const [about,setAbout]=useState("");

  function generate(){
    let jsonld;
    if(mode==="faq") jsonld=buildFAQ({url, faqText});
    else if(mode==="article") jsonld=buildArticle({headline,url,author,image:artImage,keywords,about});
    else jsonld=buildBusiness({businessType,name,url,telephone,email,street,locality,region,postalCode,country,description,areaServed,priceRange,hours,latitude,longitude,logo,image,sameAs});
    setOut(`<script type="application/ld+json">\n${JSON.stringify(jsonld,null,2)}\n</script>`);
  }

  return (
    <section className="space-y-6">
      <div className="flex gap-2">
        <button onClick={()=>setMode("business")} className={`rounded-xl px-3 py-2 ${mode==="business"?"bg-neutral-900 text-white":"border"}`}>Business</button>
        <button onClick={()=>setMode("faq")} className={`rounded-xl px-3 py-2 ${mode==="faq"?"bg-neutral-900 text-white":"border"}`}>FAQ</button>
        <button onClick={()=>setMode("article")} className={`rounded-xl px-3 py-2 ${mode==="article"?"bg-neutral-900 text-white":"border"}`}>Article</button>
      </div>

      <div className="grid gap-3">
        <label className="text-sm font-medium">Page URL (optional)</label>
        <input className="rounded-xl border p-2" placeholder="https://example.com/page" value={url} onChange={e=>setUrl(e.target.value)} />
      </div>

      {mode==="business" && (
        <div className="grid gap-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select className="rounded-xl border p-2" value={businessType} onChange={e=>setBusinessType(e.target.value)}>
              {["LocalBusiness","ProfessionalService","LegalService","HomeAndConstructionBusiness","MedicalBusiness","Store","Restaurant","FinancialService","AutomotiveBusiness","HealthAndBeautyBusiness"].map(t=>(<option key={t} value={t}>{t}</option>))}
            </select>
            <input className="rounded-xl border p-2" placeholder="Business Name" value={name} onChange={e=>setName(e.target.value)} />
            <input className="rounded-xl border p-2" placeholder="Phone (e.g., +1-555-555-5555)" value={telephone} onChange={e=>setTelephone(e.target.value)} />
            <input className="rounded-xl border p-2" placeholder="Email (optional)" value={email} onChange={e=>setEmail(e.target.value)} />
            <textarea className="rounded-xl border p-2 md:col-span-2" rows={3} placeholder="Short Description" value={description} onChange={e=>setDescription(e.target.value)} />
            <input className="rounded-xl border p-2" placeholder="Street" value={street} onChange={e=>setStreet(e.target.value)} />
            <input className="rounded-xl border p-2" placeholder="City" value={locality} onChange={e=>setLocality(e.target.value)} />
            <input className="rounded-xl border p-2" placeholder="Region/State" value={region} onChange={e=>setRegion(e.target.value)} />
            <input className="rounded-xl border p-2" placeholder="Postal Code" value={postalCode} onChange={e=>setPostalCode(e.target.value)} />
            <input className="rounded-xl border p-2" placeholder="Country code (US, CA…)" value={country} onChange={e=>setCountry(e.target.value)} />
            <input className="rounded-xl border p-2" placeholder="Area served (e.g., Toronto GTA)" value={areaServed} onChange={e=>setAreaServed(e.target.value)} />
            <input className="rounded-xl border p-2" placeholder="Price range (e.g., $$)" value={priceRange} onChange={e=>setPriceRange(e.target.value)} />
            <input className="rounded-xl border p-2" placeholder="Hours (e.g., Mo-Fr 09:00-17:00)" value={hours} onChange={e=>setHours(e.target.value)} />
            <input className="rounded-xl border p-2" placeholder="Latitude (optional)" value={latitude} onChange={e=>setLatitude(e.target.value)} />
            <input className="rounded-xl border p-2" placeholder="Longitude (optional)" value={longitude} onChange={e=>setLongitude(e.target.value)} />
            <input className="rounded-xl border p-2" placeholder="Logo URL (optional)" value={logo} onChange={e=>setLogo(e.target.value)} />
            <input className="rounded-xl border p-2" placeholder="Image URL (optional)" value={image} onChange={e=>setImage(e.target.value)} />
            <input className="rounded-xl border p-2 md:col-span-2" placeholder="SameAs profiles (comma-separated URLs)" value={sameAs} onChange={e=>setSameAs(e.target.value)} />
          </div>
        </div>
      )}

      {mode==="faq" && (
        <div className="grid gap-3">
          <label className="text-sm font-medium">Q&A (blank line between each)</label>
          <textarea className="rounded-xl border p-3" rows={8} value={faqText} onChange={e=>setFaqText(e.target.value)} />
        </div>
      )}

      {mode==="article" && (
        <div className="grid gap-3">
          <input className="rounded-xl border p-2" placeholder="Headline" value={headline} onChange={e=>setHeadline(e.target.value)} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="rounded-xl border p-2" placeholder="Author" value={author} onChange={e=>setAuthor(e.target.value)} />
            <input className="rounded-xl border p-2" placeholder="Hero image URL (optional)" value={artImage} onChange={e=>setArtImage(e.target.value)} />
          </div>
          <input className="rounded-xl border p-2" placeholder="Keywords (comma-separated)" value={keywords} onChange={e=>setKeywords(e.target.value)} />
          <textarea className="rounded-xl border p-2" rows={3} placeholder="About (topic/brand context)" value={about} onChange={e=>setAbout(e.target.value)} />
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={generate} className="rounded-xl border px-4 py-2">Generate Schema</button>
        {out && <button onClick={()=>navigator.clipboard.writeText(out).catch(()=>{})} className="rounded-xl border px-4 py-2">Copy</button>}
      </div>

      {out && <pre className="rounded-xl border p-3 overflow-auto text-sm whitespace-pre-wrap">{out}</pre>}
    </section>
  );
}
