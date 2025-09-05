function clean(obj){return Object.fromEntries(Object.entries(obj).filter(([,v])=>v!==undefined&&v!==""&&!(Array.isArray(v)&&!v.length)))}
function arr(csv){return (csv||"").split(/\s*,\s*/).filter(Boolean)}
export function faqSchema({ url="", items=[] }) {
  const s = {"@context":"https://schema.org","@type":"FAQPage",mainEntity:items.map(([q,a])=>({"@type":"Question",name:q,acceptedAnswer:{"@type":"Answer",text:a}}))};
  if(url) s.url=url; return s;
}
export function articleSchema({ headline, url="", author="Staff", image="", keywords=[], about="" }) {
  const now=new Date().toISOString();
  return clean({"@context":"https://schema.org","@type":"Article",headline,author:{"@type":"Person",name:author},datePublished:now,dateModified:now,url,image,keywords,about});
}
export function businessSchema(input){
  const type=input.businessType||"LocalBusiness";
  const addr={"@type":"PostalAddress",streetAddress:input.street,addressLocality:input.locality,addressRegion:input.region,postalCode:input.postalCode,addressCountry:input.country};
  const s={"@context":"https://schema.org","@type":type,name:input.name,url:input.url,telephone:input.telephone,email:input.email,description:input.description,priceRange:input.priceRange,areaServed:input.areaServed,image:input.image,logo:input.logo,address:addr};
  if(input.latitude && input.longitude){s.geo={"@type":"GeoCoordinates",latitude:Number(input.latitude),longitude:Number(input.longitude)}}
  if(input.hours){s.openingHours=input.hours}
  const same=arr(input.sameAs); if(same.length) s.sameAs=same;
  return clean(s);
}
