"use client";
import { useEffect, useMemo, useState, useRef } from "react";

/** ---------- small helpers ---------- **/
const csv = (s) => (s || "").split(/\s*,\s*/).filter(Boolean);
const clean = (obj) =>
  Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) => !(v === "" || v == null || (Array.isArray(v) && !v.length))
    )
  );
const phoneFromText = (txt="") => {
  const m = txt.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3}[-.\s]?\d{3,4}/);
  return m ? m[0] : "";
};
const niceNameFromUrl = (u="") => {
  try {
    const h = new URL(u).hostname.replace(/^www\./,"");
    const base = h.split(".")[0].replace(/[-_]/g," ");
    return base.replace(/\b\w/g, c => c.toUpperCase());
  } catch { return ""; }
};
const guessBusinessType = (seed="") => {
  const s = (seed||"").toLowerCase();
  if (/(law|attorney|legal)/.test(s)) return "LegalService";
  if (/(clinic|medical|dentist|chiro|physio)/.test(s)) return "MedicalBusiness";
  if (/(plumb|electric|roof|hvac|remodel|contract)/.test(s)) return "HomeAndConstructionBusiness";
  if (/(restaurant|cafe|bistro|pizza|barbecue|sushi)/.test(s)) return "Restaurant";
  if (/(salon|spa|barber|beauty)/.test(s)) return "HealthAndBeautyBusiness";
  if (/(bank|account|tax|bookkeep|insurance)/.test(s)) return "FinancialService";
  if (/(auto|mechanic|tire|detailing)/.test(s)) return "AutomotiveBusiness";
  if (/(store|shop|retail)/.test(s)) return "Store";
  if (/(it|web|marketing|consult|design)/.test(s)) return "ProfessionalService";
  return "LocalBusiness";
};

/** ---------- builders ---------- **/
const buildFAQ = ({ url, faqText }) => {
  const items = (faqText || "")
    .split(/\n{2,}/)
    .map((b) => {
      const [first, ...rest] = b.trim().split(/\n/);
      const q = (first || "").replace(/^Q:\s*/i, "").trim();
      const a = (rest.join(" ") || "").replace(/^A:\s*/i, "").trim();
      return q && a
        ? { "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } }
        : null;
    })
    .filter(Boolean);
  return clean({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    url,
    mainEntity: items,
  });
};

const buildArticle = ({ headline, url, author, image, keywords, about }) => {
  const now = new Date().toISOString();
  return clean({
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    url,
    author: author ? { "@type": "Person", name: author } : undefined,
    image,
    keywords: csv(keywords),
    about,
    datePublished: now,
    dateModified: now,
  });
};

const buildBusiness = (p) => {
  const type = p.businessType || "LocalBusiness";
  const address = clean({
    "@type": "PostalAddress",
    streetAddress: p.street,
    addressLocality: p.locality,
    addressRegion: p.region,
    postalCode: p.postalCode,
    addressCountry: p.country,
  });
  const s = clean({
    "@context": "https://schema.org",
    "@type": type,
    name: p.name,
    url: p.url,
    telephone: p.telephone,
    email: p.email,
    description: p.description,
    priceRange: p.priceRange,
    areaServed: p.areaServed,
    image: p.image,
    logo: p.logo,
    address,
    openingHours: p.hours,
    sameAs: csv(p.sameAs),
  });
  if (p.latitude && p.longitude) {
    s.geo = { "@type": "GeoCoordinates", latitude: Number(p.latitude), longitude: Number(p.longitude) };
  }
  return s;
};

const buildService = (p) => {
  return clean({
    "@context": "https://schema.org",
    "@type": "Service",
    name: p.name,
    description: p.description,
    areaServed: p.areaServed,
    provider: p.providerName ? { "@type": "Organization", name: p.providerName } : undefined,
    serviceType: p.serviceType,
    url: p.url,
  });
};

const buildBreadcrumb = (p) => {
  const items = (p.lines || "")
    .split(/\n+/)
    .map((ln, i) => {
      const [name, item] = ln.split(/\s*,\s*/);
      return name && item ? {
        "@type": "ListItem",
        position: i + 1,
        name,
        item
      } : null;
    })
    .filter(Boolean);
  return clean({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  });
};

const buildOrganization = (p) => clean({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: p.name,
  url: p.url,
  logo: p.logo,
  sameAs: csv(p.sameAs),
  contactPoint: p.telephone ? [{ "@type": "ContactPoint", telephone: p.telephone }] : undefined,
});

const buildProduct = (p) => clean({
  "@context": "https://schema.org",
  "@type": "Product",
  name: p.name,
  description: p.description,
  image: csv(p.image),
  sku: p.sku,
  brand: p.brand ? { "@type": "Brand", name: p.brand } : undefined,
  offers: p.price ? clean({
    "@type": "Offer",
    price: p.price,
    priceCurrency: p.currency || "USD",
    availability: p.availability || "https://schema.org/InStock",
    url: p.url,
  }) : undefined,
});

/** ---------- validation ---------- **/
const REQUIRED = {
  business: ["name"],
  faq: ["faqText"],
  article: ["headline"],
  service: ["name"],
  breadcrumb: ["lines"],
  organization: ["name"],
  product: ["name"],
};

function validate(mode, state) {
  const missing = [];
  (REQUIRED[mode] || []).forEach((k) => {
    if (!state[k] || (typeof state[k] === "string" && !state[k].trim())) missing.push(k);
  });
  return missing;
}

/** ---------- component ---------- **/
export default function SchemaPanel({ initialUrl = "", seedKeywords = "", about = "", audit = null }) {
  const [mode, setMode] = useState("business");
  const [out, setOut] = useState("");
  const [errors, setErrors] = useState([]);

  // storage key: site-scoped
  const storageKey = useMemo(() => {
    try { return `schemaForm_v1::${new URL(initialUrl).hostname}`; } catch { return "schemaForm_v1::default"; }
  }, [initialUrl]);

  // shared
  const [url, setUrl] = useState(initialUrl || "");
  useEffect(()=>{ setUrl(initialUrl || ""); }, [initialUrl]);

  // business-ish
  const [businessType, setBusinessType] = useState("LocalBusiness");
  const [name, setName] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [street, setStreet] = useState("");
  const [locality, setLocality] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [description, setDescription] = useState("");
  const [areaServed, setAreaServed] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [hours, setHours] = useState("Mo-Fr 09:00-17:00");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [logo, setLogo] = useState("");
  const [image, setImage] = useState("");
  const [sameAs, setSameAs] = useState("");

  // faq
  const [faqText, setFaqText] = useState("Q: Example question?\nA: Example answer.");

  // article
  const [headline, setHeadline] = useState("");
  const [author, setAuthor] = useState("");
  const [artImage, setArtImage] = useState("");
  const [keywords, setKeywords] = useState("");

  // service
  const [serviceName, setServiceName] = useState("");
  const [serviceDesc, setServiceDesc] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [serviceProvider, setServiceProvider] = useState("");
  const [serviceType, setServiceType] = useState("");

  // breadcrumb
  const [crumbLines, setCrumbLines] = useState("Home, /\nProducts, /products\nWidget, /products/widget");

  // organization
  const [orgName, setOrgName] = useState("");

  // product
  const [prodName, setProdName] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodImage, setProdImage] = useState("");
  const [prodSKU, setProdSKU] = useState("");
  const [prodBrand, setProdBrand] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodCurrency, setProdCurrency] = useState("USD");
  const [prodAvail, setProdAvail] = useState("https://schema.org/InStock");

  /** Prefill once (url/name/phone + business type guess) **/
  const didPrefill = useRef(false);
  useEffect(() => {
    if (didPrefill.current) return;
    didPrefill.current = true;
    if (!name) setName(niceNameFromUrl(initialUrl) || name);
    if (!telephone) {
      const fromAbout = phoneFromText(about || "");
      if (fromAbout) setTelephone(fromAbout);
    }
    // Guess type from keywords/about
    const guess = guessBusinessType(`${seedKeywords} ${about}`);
    setBusinessType(guess);
  }, [initialUrl, seedKeywords, about]); // run once effectively

  /** Load saved state (localStorage) **/
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
      if (!saved || typeof saved !== "object") return;
      // restore known keys if present
      const setters = {
        mode: setMode, url: setUrl, businessType: setBusinessType, name: setName, telephone: setTelephone,
        email: setEmail, street: setStreet, locality: setLocality, region: setRegion, postalCode: setPostalCode,
        country: setCountry, description: setDescription, areaServed: setAreaServed, priceRange: setPriceRange,
        hours: setHours, latitude: setLatitude, longitude: setLongitude, logo: setLogo, image: setImage,
        sameAs: setSameAs, faqText: setFaqText, headline: setHeadline, author: setAuthor, artImage: setArtImage,
        keywords: setKeywords, serviceName: setServiceName, serviceDesc: setServiceDesc, serviceArea: setServiceArea,
        serviceProvider: setServiceProvider, serviceType: setServiceType, crumbLines: setCrumbLines,
        orgName: setOrgName, prodName: setProdName, prodDesc: setProdDesc, prodImage: setProdImage,
        prodSKU: setProdSKU, prodBrand: setProdBrand, prodPrice: setProdPrice, prodCurrency: setProdCurrency,
        prodAvail: setProdAvail,
      };
      Object.entries(setters).forEach(([k, fn]) => { if (k in saved) fn(saved[k]); });
    } catch {}
  }, [storageKey]);

  /** Save state (debounced) **/
  useEffect(() => {
    if (typeof window === "undefined") return;
    const state = {
      mode, url, businessType, name, telephone, email, street, locality, region, postalCode, country,
      description, areaServed, priceRange, hours, latitude, longitude, logo, image, sameAs, faqText,
      headline, author, artImage, keywords, serviceName, serviceDesc, serviceArea, serviceProvider,
      serviceType, crumbLines, orgName, prodName, prodDesc, prodImage, prodSKU, prodBrand, prodPrice,
      prodCurrency, prodAvail,
    };
    const id = setTimeout(() => {
      try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch {}
    }, 250);
    return () => clearTimeout(id);
  }, [
    storageKey, mode, url, businessType, name, telephone, email, street, locality, region, postalCode, country,
    description, areaServed, priceRange, hours, latitude, longitude, logo, image, sameAs, faqText,
    headline, author, artImage, keywords, serviceName, serviceDesc, serviceArea, serviceProvider,
    serviceType, crumbLines, orgName, prodName, prodDesc, prodImage, prodSKU, prodBrand, prodPrice,
    prodCurrency, prodAvail
  ]);

  function generate() {
    // build and validate per mode
    let jsonld; let missing = [];
    if (mode === "faq") {
      jsonld = buildFAQ({ url, faqText });
      missing = validate("faq", { faqText });
    } else if (mode === "article") {
      jsonld = buildArticle({ headline, url, author, image: artImage, keywords, about });
      missing = validate("article", { headline });
    } else if (mode === "service") {
      jsonld = buildService({ name: serviceName, description: serviceDesc, areaServed: serviceArea, providerName: serviceProvider, serviceType, url });
      missing = validate("service", { name: serviceName });
    } else if (mode === "breadcrumb") {
      jsonld = buildBreadcrumb({ lines: crumbLines });
      missing = validate("breadcrumb", { lines: crumbLines });
    } else if (mode === "organization") {
      jsonld = buildOrganization({ name: orgName || name, url, logo, sameAs, telephone });
      missing = validate("organization", { name: orgName || name });
    } else if (mode === "product") {
      jsonld = buildProduct({ name: prodName, description: prodDesc, image: prodImage, sku: prodSKU, brand: prodBrand, price: prodPrice, currency: prodCurrency, availability: prodAvail, url });
      missing = validate("product", { name: prodName });
    } else {
      jsonld = buildBusiness({ businessType, name, url, telephone, email, street, locality, region, postalCode, country, description, areaServed, priceRange, hours, latitude, longitude, logo, image, sameAs });
      missing = validate("business", { name });
    }

    setErrors(missing);
    if (missing.length) {
      setOut(""); // don’t keep stale
      return;
    }
    setOut(`<script type="application/ld+json">\n${JSON.stringify(jsonld, null, 2)}\n</script>`);
  }

  const canCopy = !!out && errors.length === 0;

  return (
    <section className="space-y-6">
      {/* mode selector */}
      <div className="flex flex-wrap gap-2">
        {[
          ["business","Business"],
          ["faq","FAQ"],
          ["article","Article"],
          ["service","Service"],
          ["breadcrumb","Breadcrumb"],
          ["organization","Organization"],
          ["product","Product"],
        ].map(([val,label])=>(
          <button key={val} onClick={()=>setMode(val)} className={`rounded-xl px-3 py-2 ${mode===val?"bg-neutral-900 text-white":"border"}`}>{label}</button>
        ))}
      </div>

      {/* shared URL */}
      <div className="grid gap-2">
        <label className="text-sm text-gray-700">Page URL (optional)</label>
        <input className="rounded-xl border p-2" placeholder="https://example.com/page" value={url} onChange={e=>setUrl(e.target.value)} />
      </div>

      {/* business form */}
      {mode==="business" && (
        <div className="grid gap-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select className="rounded-xl border p-2" value={businessType} onChange={e=>setBusinessType(e.target.value)}>
              {["LocalBusiness","ProfessionalService","LegalService","HomeAndConstructionBusiness","MedicalBusiness","Store","Restaurant","FinancialService","AutomotiveBusiness","HealthAndBeautyBusiness"].map(t=>(<option key={t} value={t}>{t}</option>))}
            </select>
            <input className="rounded-xl border p-2" placeholder="Business Name" value={name} onChange={e=>setName(e.target.value)} />
            <input className="rounded-xl border p-2" placeholder="Phone (+1-555-555-5555)" value={telephone} onChange={e=>setTelephone(e.target.value)} />
            <input className="rounded-xl border p-2" placeholder="Email (optional)" value={email} onChange={e=>setEmail(e.target.value)} />
            <textarea className="rounded-xl border p-2 md:col-span-2" rows={3} placeholder="Short Description" value={description} onChange={e=>setDescription(e.target.value)} />
            <input className="rounded-xl border p-2" placeholder="Street" value={street} onChange={e=>setStreet(e.target.value)} />
            <input className="rounded-xl border p-2" placeholder="City" value={locality} onChange={e=>setLocality(e.target.value)} />
            <input className="rounded-xl border p-2" placeholder="Region/State" value={region} onChange={e=>setRegion(e.target.value)} />
            <input className="rounded-xl border p-2" placeholder="Postal Code" value={postalCode} onChange={e=>setPostalCode(e.target.value)} />
            <input className="rounded-xl border p-2" placeholder="Country (US, CA…)" value={country} onChange={e=>setCountry(e.target.value)} />
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
          <textarea className="rounded-xl border p-2" rows={3} placeholder="About (topic/brand context)" value={about} onChange={()=>{}} readOnly />
        </div>
      )}

      {mode==="service" && (
        <div className="grid gap-3">
          <input className="rounded-xl border p-2" placeholder="Service Name" value={serviceName} onChange={e=>setServiceName(e.target.value)} />
          <textarea className="rounded-xl border p-2" rows={3} placeholder="Service Description" value={serviceDesc} onChange={e=>setServiceDesc(e.target.value)} />
          <input className="rounded-xl border p-2" placeholder="Area Served" value={serviceArea} onChange={e=>setServiceArea(e.target.value)} />
          <input className="rounded-xl border p-2" placeholder="Provider Organization" value={serviceProvider} onChange={e=>setServiceProvider(e.target.value)} />
          <input className="rounded-xl border p-2" placeholder="Service Type (optional)" value={serviceType} onChange={e=>setServiceType(e.target.value)} />
        </div>
      )}

      {mode==="breadcrumb" && (
        <div className="grid gap-3">
          <label className="text-sm font-medium">Breadcrumb lines (name, url) per line</label>
          <textarea className="rounded-xl border p-3" rows={6} value={crumbLines} onChange={e=>setCrumbLines(e.target.value)} />
        </div>
      )}

      {mode==="organization" && (
        <div className="grid gap-3">
          <input className="rounded-xl border p-2" placeholder="Organization Name" value={orgName} onChange={e=>setOrgName(e.target.value)} />
          <input className="rounded-xl border p-2" placeholder="Logo URL (optional)" value={logo} onChange={e=>setLogo(e.target.value)} />
          <input className="rounded-xl border p-2" placeholder="SameAs profiles (comma-separated URLs)" value={sameAs} onChange={e=>setSameAs(e.target.value)} />
        </div>
      )}

      {mode==="product" && (
        <div className="grid gap-3">
          <input className="rounded-xl border p-2" placeholder="Product Name" value={prodName} onChange={e=>setProdName(e.target.value)} />
          <textarea className="rounded-xl border p-2" rows={3} placeholder="Product Description" value={prodDesc} onChange={e=>setProdDesc(e.target.value)} />
          <div className="grid md:grid-cols-2 gap-3">
            <input className="rounded-xl border p-2" placeholder="Image URL(s), comma-separated" value={prodImage} onChange={e=>setProdImage(e.target.value)} />
            <input className="rounded-xl border p-2" placeholder="SKU (optional)" value={prodSKU} onChange={e=>setProdSKU(e.target.value)} />
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <input className="rounded-xl border p-2" placeholder="Brand (optional)" value={prodBrand} onChange={e=>setProdBrand(e.target.value)} />
            <input className="rounded-xl border p-2" placeholder="Price (e.g., 49.99)" value={prodPrice} onChange={e=>setProdPrice(e.target.value)} />
            <input className="rounded-xl border p-2" placeholder="Currency (USD, CAD)" value={prodCurrency} onChange={e=>setProdCurrency(e.target.value)} />
          </div>
          <select className="rounded-xl border p-2" value={prodAvail} onChange={e=>setProdAvail(e.target.value)}>
            {["https://schema.org/InStock","https://schema.org/OutOfStock","https://schema.org/PreOrder"].map(a=>(<option key={a} value={a}>{a.split("/").pop()}</option>))}
          </select>
        </div>
      )}

      {/* actions */}
      <div className="flex items-center gap-3">
        <button onClick={generate} className="rounded-xl border px-4 py-2">Generate Schema</button>
        <button
          onClick={()=>{ if (out) navigator.clipboard.writeText(out).catch(()=>{}); }}
          disabled={!canCopy}
          className={`rounded-xl px-4 py-2 ${canCopy ? "border" : "border opacity-50 cursor-not-allowed"}`}
        >
          Copy
        </button>
      </div>

      {/* validation + output */}
      {!!errors.length && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Missing required: {errors.join(", ")}
        </div>
      )}
      {out && errors.length===0 && (
        <pre className="rounded-xl border p-3 overflow-auto text-sm whitespace-pre-wrap">{out}</pre>
      )}
    </section>
  );
}
