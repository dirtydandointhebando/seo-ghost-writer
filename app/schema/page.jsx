"use client";
import { useState } from "react";

const BUSINESS_TYPES=[
  "LocalBusiness","ProfessionalService","LegalService","HomeAndConstructionBusiness",
  "MedicalBusiness","Store","Restaurant","FinancialService","AutomotiveBusiness","HealthAndBeautyBusiness"
];

export default function SchemaPage(){
  const [tabType,setTabType]=useState("business");
  const [out,setOut]=useState("");

  // shared
  const [url,setUrl]=useState("");

  // business
  const [businessType,setBusinessType]=useState("LocalBusiness");
  const [customType,setCustomType]=useState("");
  const [name,setName]=useState("");
  const [telephone,setTelephone]=useState("");
  const [email,setEmail]=useState("");
  const [street,setStreet]=useState(""); const [locality,setLocality]=useState("");
  const [region,setRegion]=useState(""); const [postalCode,setPostalCode]=useState("");
  const [country,setCountry]=useState("");
  const [description,setDescription]=useState("");
  const [areaServed,setAreaServed]=useState("");
  const [priceRange,setPriceRange]=useState("");
  const [hours,setHours]=useState("Mo-Fr 09:00-17:00; Sa 10:00-14:00");
  const [latitude,setLatitude]=useState(""); const [longitude,setLongitude]=useState("");
  const [logo,setLogo]=useState(""); const [image,setImage]=useState("");
  const [sameAs,setSameAs]=useState("");

  // faq
  const [faqText,setFaqText]=useState("Q: Example question?\nA: Example answer.");

  // article
  const [headline,setHeadline]=useState(""); const [author,setAuthor]=useState("");
  const [artImage,setArtImage]=useState(""); const [keywords,setKeywords]=useState("");
  const [about,setAbout]=useState("");

  async function generate(){
    const type = tabType;
    const body={ type, url };
    if(type==="business"){
      Object.assign(body,{
        businessType: customType || businessType, name, telephone, email,
        street, locality, region, postalCode, country,
        description, areaServed, priceRange, hours, latitude, longitude, logo, image, sameAs
      });
    }else if(type==="faq"){
      Object.assign(body,{ faqText });
    }else if(type==="article"){
      Object.assign(body,{ headline, author, image: artImage, keywords, about });
    }
    const res = await fetch("/api/schema",{ method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(body) });
    const json = await res.json();
    const jsonld = json.jsonld ? JSON.stringify(json.jsonld,null,2) : JSON.stringify(json,null,2);
    setOut(`<script type="application/ld+json">\\n${jsonld}\\n</script>`);
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex gap-2 mb-4">
        <a href="/" className="rounded-xl border px-3 py-2">Audit</a>
        <a href="/" className="rounded-xl border px-3 py-2">Topics</a>
        <a href="/" className="rounded-xl border px-3 py-2">Content</a>
        <button className="rounded-xl px-3 py-2 bg-neutral-900 text-white">Schema</button>
      </div>

      <h1 className="text-2xl font-semibold">Schema Generator</h1>

      <div className="flex gap-2">
        <button onClick={()=>setTabType("business")} className={`rounded-xl px-3 py-2 ${tabType==="business"?"bg-neutral-900 text-white":"border"}`}>Business</button>
        <button onClick={()=>setTabType("faq")} className={`rounded-xl px-3 py-2 ${tabType==="faq"?"bg-neutral-900 text-white":"border"}`}>FAQ</button>
        <button onClick={()=>setTabType("article")} className={`rounded-xl px-3 py-2 ${tabType==="article"?"bg-neutral-900 text-white":"border"}`}>Article</button>
      </div>

      <div className="grid gap-3">
        <label className="text-sm font-medium">Page URL (optional)</label>
        <input className="rounded-xl border p-2" placeholder="https://example.com/page" value={url} onChange={e=>setUrl(e.target.value)} />
      </div>

      {tabType==="business" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Business Type</label>
              <select className="rounded-xl border p-2 w-full" value={businessType} onChange={e=>setBusinessType(e.target.value)}>
                {BUSINESS_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
              <input className="rounded-xl border p-2 mt-2 w-full" placeholder="Custom @type (optional)" value={customType} onChange={e=>setCustomType(e.target.value)} />
            </div>
            <input className="rounded-xl border p-2" placeholder="Business Name" value={name} onChange={e=>setName(e.target.value)} />
            <input className="rounded-xl border p-2" placeholder="Phone (e.g., +1-555-555-5555)" value={telephone} onChange={e=>setTelephone(e.target.value)} />
            <input className="rounded-xl border p-2" placeholder="Email (optional)" value={email} onChange={e=>setEmail(e.target.value)} />
            <input className="rounded-xl border p-2 md:col-span-2" placeholder="Short Description" value={description} onChange={e=>setDescription(e.target.value)} />
            <input className="rounded-xl border p-2" placeholder="Street" value={street} onChange={e=>setStreet(e.target.value)} />
            <input className="rounded-xl border p-2" placeholder="City" value={locality} onChange={e=>setLocality(e.target.value)} />
            <input className="rounded-xl border p-2" placeholder="Region/State" value={region} onChange={e=>setRegion(e.target.value)} />
            <input className="rounded-xl border p-2" placeholder="Postal Code" value={postalCode} onChange={e=>setPostalCode(e.target.value)} />
            <input className="rounded-xl border p-2" placeholder="Country code (e.g., US, CA)" value={country} onChange={e=>setCountry(e.target.value)} />
            <input className="rounded-xl border p-2" placeholder="Area served (e.g., Toronto GTA)" value={areaServed} onChange={e=>setAreaServed(e.target.value)} />
            <input className="rounded-xl border p-2" placeholder="Price range (e.g., $$)" value={priceRange} onChange={e=>setPriceRange(e.target.value)} />
            <input className="rounded-xl border p-2" placeholder="Hours (e.g., Mo-Fr 09:00-17:00; Sa 10:00-14:00)" value={hours} onChange={e=>setHours(e.target.value)} />
            <input className="rounded-xl border p-2" placeholder="Latitude (optional)" value={latitude} onChange={e=>setLatitude(e.target.value)} />
            <input className="rounded-xl border p-2" placeholder="Longitude (optional)" value={longitude} onChange={e=>setLongitude(e.target.value)} />
            <input className="rounded-xl border p-2" placeholder="Logo URL (optional)" value={logo} onChange={e=>setLogo(e.target.value)} />
            <input className="rounded-xl border p-2" placeholder="Image URL (optional)" value={image} onChange={e=>setImage(e.target.value)} />
            <input className="rounded-xl border p-2 md:col-span-2" placeholder="SameAs profiles (comma-separated URLs)" value={sameAs} onChange={e=>setSameAs(e.target.value)} />
          </div>
        </div>
      )}

      {tabType==="faq" && (
        <div className="grid gap-3">
          <label className="text-sm font-medium">Q&A (blank line between each)</label>
          <textarea className="rounded-xl border p-3" rows={8} value={faqText} onChange={e=>setFaqText(e.target.value)} />
          <p className="text-xs text-gray-600">Format: First line Question (optionally “Q:”), next line(s) Answer (optionally “A:”). Separate pairs with a blank line.</p>
        </div>
      )}

      {tabType==="article" && (
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
        {out && (
          <button onClick={()=>navigator.clipboard.writeText(out).catch(()=>{})} className="rounded-xl border px-4 py-2">Copy</button>
        )}
      </div>

      {out && (<pre className="rounded-xl border p-3 overflow-auto text-sm whitespace-pre-wrap">{out}</pre>)}
    </main>
  );
}
