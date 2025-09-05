import * as cheerio from "cheerio";

export async function fetchHtml(url) {
  const res = await fetch(url, { redirect: "follow", cache: "no-store" });
  const html = await res.text();
  return { html, status: res.status, headers: res.headers, finalUrl: res.url };
}

export async function runBasicAudit(html, url, meta = {}) {
  const $ = cheerio.load(html);
  const text = (s) => (s || "").trim();

  // Meta & head
  const title = text($("head > title").text());
  const metaDesc = $('meta[name="description"]').attr("content") || "";
  const canonical = $('link[rel="canonical"]').attr("href") || "";
  const canonicalAbs = canonical ? new URL(canonical, url).toString() : "";
  let canonicalHostMatch = true;
  try {
    if (canonicalAbs) {
      canonicalHostMatch =
        new URL(canonicalAbs).hostname === new URL(url).hostname;
    }
  } catch {
    canonicalHostMatch = false;
  }

  // Social
  const ogTitle = $('meta[property="og:title"]').attr("content") || "";
  const ogDesc = $('meta[property="og:description"]').attr("content") || "";
  const twitterCard = $('meta[name="twitter:card"]').attr("content") || "";
  const favicon =
    $('link[rel="icon"]').attr("href") ||
    $('link[rel="shortcut icon"]').attr("href") ||
    "";

  // Headings
  const h1s = $("h1");
  const h2s = $("h2");

  // Images (alt, dimensions, lazy)
  const imgs = $("img");
  let missingAlt = 0,
    missingDims = 0,
    notLazy = 0;
  imgs.each((_, el) => {
    const $el = $(el);
    const alt = $el.attr("alt");
    if (!alt || !alt.trim()) missingAlt++;
    if (!$el.attr("width") || !$el.attr("height")) missingDims++;
    const loading = ($el.attr("loading") || "").toLowerCase();
    if (loading !== "lazy") notLazy++;
  });

  // Links (counts)
  const anchors = $("a");
  const host = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return "";
    }
  })();
  let internal = 0,
    external = 0,
    emptyHref = 0,
    nofollow = 0;
  anchors.each((_, el) => {
    const $el = $(el);
    const href = $el.attr("href") || "";
    const rel = ("" + ($el.attr("rel") || "")).toLowerCase();
    if (!href || href === "#") {
      emptyHref++;
      return;
    }
    if (
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("javascript:")
    )
      return;
    try {
      const u = new URL(href, url);
      if (u.hostname === host) internal++;
      else external++;
    } catch {}
    if (/nofollow/.test(rel)) nofollow++;
  });

  // Robots meta/header
  const robotsMeta = $('meta[name="robots"]').attr("content") || "";
  const metaNoindex = /noindex/i.test(robotsMeta);
  const xRobots =
    (meta.headers && meta.headers.get && (meta.headers.get("x-robots-tag") || "")) ||
    "";
  const xNoindex = /noindex/i.test(xRobots);

  // JSON-LD schema
  const jsonLdBlocks = $('script[type="application/ld+json"]');
  const types = [];
  jsonLdBlocks.each((_, el) => {
    try {
      const txt = $(el).contents().text();
      const data = JSON.parse(txt);
      const arr = Array.isArray(data) ? data : [data];
      arr.forEach((obj) => {
        if (obj && obj["@type"]) {
          if (Array.isArray(obj["@type"])) types.push(...obj["@type"]);
          else types.push(obj["@type"]);
        }
      });
    } catch {}
  });

  // html[lang]
  const htmlLang = $("html").attr("lang") || "";

  // robots.txt & sitemap.xml
  let robotsTxtFound = false,
    robotsTxtBlocksAll = false,
    sitemapFound = false;
  try {
    const r = await fetch(new URL("/robots.txt", url).toString(), {
      cache: "no-store",
    });
    robotsTxtFound = r.ok;
    const txt = r.ok ? await r.text() : "";
    robotsTxtBlocksAll = /(^|\n)\s*User-agent:\s*\*\s*[\s\S]*?\n\s*Disallow:\s*\/\s*(\n|$)/i.test(
      txt
    );
  } catch {}
  try {
    const s = await fetch(new URL("/sitemap.xml", url).toString(), {
      cache: "no-store",
    });
    sitemapFound = s.ok;
  } catch {}

  const status = meta.status || 0;
  const indexable =
    status >= 200 && status < 400 && !metaNoindex && !xNoindex && !robotsTxtBlocksAll;

  return {
    meta: {
      titleFound: !!title,
      titleLength: title.length,
      descriptionFound: !!metaDesc,
      descriptionLength: metaDesc.length,
      canonicalFound: !!canonical,
      canonicalAbs,
      canonicalHostMatch,
    },
    headings: { h1Count: h1s.length, h2Count: h2s.length },
    images: { total: imgs.length, missingAlt, missingDims, notLazy },
    links: { internal, external, emptyHref, nofollow },
    schema: { jsonldFound: jsonLdBlocks.length > 0, types: Array.from(new Set(types)) },
    robots: {
      robotsTxtFound,
      robotsTxtBlocksAll,
      metaNoindex,
      xNoindex,
      sitemapFound,
    },
    social: {
      ogTitle: !!ogTitle,
      ogDescription: !!ogDesc,
      twitterCard: !!twitterCard,
      favicon: !!favicon,
    },
    document: { langPresent: !!htmlLang, lang: htmlLang },
    http: { status, indexable },
  };
}
