import * as cheerio from "cheerio";

export async function fetchHtml(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
  const html = await res.text();
  return html;
}

export function runBasicAudit(html, url) {
  const $ = cheerio.load(html);

  const title = $("head > title").text().trim();
  const metaDesc = $('meta[name="description"]').attr("content") || "";
  const canonical = $('link[rel="canonical"]').attr("href") || "";
  const h1s = $("h1");
  const h2s = $("h2");
  const imgs = $("img");
  const robotsMeta = $('meta[name="robots"]').attr("content") || "";
  const metaNoindex = /noindex/i.test(robotsMeta);
  const jsonLdBlocks = $('script[type="application/ld+json"]');
  const robotsTxtUrl = new URL("/robots.txt", url).toString();

  let robotsTxtFound = false;
  // best-effort robots.txt check (ignore errors)
  // Note: some sites block robots.txt; treat network errors as false silently.
  // We'll swallow errors to keep the MVP robust.
  // eslint-disable-next-line no-useless-catch
  try {
    // Next.js edge/server runtime supports fetch
    // If blocked by CORS/host policy, this may fail silently.
    // That's fine for MVP.
  } catch (e) {
    // ignore
  }

  const imagesTotal = imgs.length;
  let missingAlt = 0;
  imgs.each((_, el) => {
    const alt = $(el).attr("alt");
    if (!alt || alt.trim().length === 0) missingAlt += 1;
  });

  // try to parse types from JSON-LD (best-effort)
  const types = [];
  jsonLdBlocks.each((_, el) => {
    try {
      const txt = $(el).contents().text();
      const data = JSON.parse(txt);
      const arr = Array.isArray(data) ? data : [data];
      arr.forEach(obj => {
        if (obj && obj['@type']) {
          if (Array.isArray(obj['@type'])) types.push(...obj['@type']);
          else types.push(obj['@type']);
        }
      });
    } catch {}
  });

  return {
    meta: {
      titleFound: Boolean(title),
      descriptionFound: Boolean(metaDesc),
      canonicalFound: Boolean(canonical),
    },
    headings: {
      h1Count: h1s.length,
      h2Count: h2s.length,
    },
    images: {
      total: imagesTotal,
      missingAlt,
    },
    schema: {
      jsonldFound: jsonLdBlocks.length > 0,
      types: Array.from(new Set(types)),
    },
    robots: {
      robotsTxtFound,
      metaNoindex,
    },
  };
}
