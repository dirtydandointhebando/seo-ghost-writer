export function buildRecommendations(audit, aboutText = "") {
  if (!audit) return [];
  const items = [];
  const add = (rec, why) => items.push({ rec, why });

  // HTTP / indexability
  if (audit.http?.status && audit.http.status !== 200) add(`HTTP status is ${audit.http.status}.`, "Indexable pages should return 200 so search engines can cache and rank them.");
  if (audit.http && audit.http.indexable === false) add("Page is not indexable.", "Removing noindex / global disallow enables the page to appear in search results.");

  // Titles & meta
  if (!audit.meta.titleFound) add("Add a <title> tag.", "Titles are key ranking and CTR signals on SERP.");
  else if (audit.meta.titleLength < 30 || audit.meta.titleLength > 65) add(`Tighten <title> to ~50–60 chars (current ${audit.meta.titleLength}).`, "Right-sized titles avoid truncation and improve click-through.");
  if (!audit.meta.descriptionFound) add("Write a meta description (~155 chars).", "Entices clicks by previewing value; used for snippets when relevant.");
  else if (audit.meta.descriptionLength < 50 || audit.meta.descriptionLength > 160) add(`Adjust meta description to 50–160 chars (current ${audit.meta.descriptionLength}).`, "Helps Google display a clean, complete snippet.");
  if (!audit.meta.canonicalFound) add("Add a canonical link.", "Prevents duplicate-content dilution and consolidates signals.");
  else {
    if (!audit.meta.canonicalAbs) add("Use an absolute canonical URL.", "Absolute URLs avoid resolver errors and ambiguity.");
    if (audit.meta.canonicalHostMatch === false) add("Canonical host differs from page host.", "Cross-host canonicals can leak authority if unintentional.");
  }

  // Headings
  if (audit.headings.h1Count !== 1) add(`Use exactly one H1 (found ${audit.headings.h1Count}).`, "A single H1 clarifies the main topic for users and crawlers.");
  if (audit.headings.h2Count === 0) add("Add H2 sections.", "Subheadings improve readability and help target related queries.");

  // Images
  if (audit.images.missingAlt > 0) add(`Add alt text to ${audit.images.missingAlt} image(s).`, "Alt text aids accessibility and image search visibility.");
  if (audit.images.missingDims > 0) add(`Set width/height on ${audit.images.missingDims} image(s).`, "Prevents layout shift (CLS) which impacts UX and rankings.");
  if (audit.images.notLazy > 0) add(`Use loading="lazy" on ${audit.images.notLazy} image(s).`, "Defers offscreen images to speed up initial render.");

  // Links
  if (audit.links.emptyHref > 0) add(`Fix ${audit.links.emptyHref} empty/# links.`, "Avoids broken UX and wasted crawl budget.");
  if (audit.links.internal < 3) add("Add 1–2 internal links to About/Services.", "Internal links distribute authority and help crawlers discover key pages.");
  if (audit.links.nofollow > 0) add(`Review ${audit.links.nofollow} nofollow link(s).`, "Nofollow can block equity flow; ensure it's intentional.");

  // Robots & sitemaps
  if (!audit.robots.robotsTxtFound) add("Add robots.txt.", "Communicates crawl rules and sitemap location.");
  if (audit.robots.robotsTxtBlocksAll) add("robots.txt globally disallows crawling.", "Pages won't be discovered or refreshed until allowed.");
  if (audit.robots.metaNoindex) add("Remove robots meta noindex (if this page should rank).", "Allows indexing and eligibility for SERP.");
  if (audit.robots.xNoindex) add("Remove X-Robots-Tag: noindex header (if this page should rank).", "Header rules override meta; must be cleared.");
  if (!audit.robots.sitemapFound) add("Expose sitemap.xml.", "Enables faster discovery of new/updated URLs.");

  // Schema & social
  if (!audit.schema.jsonldFound) add("Add JSON-LD schema (Article, LocalBusiness, FAQ).", "Rich results can improve CTR and trust.");
  if (!audit.social.ogTitle || !audit.social.ogDescription) add("Add Open Graph title/description.", "Clean link previews improve social CTR and brand perception.");
  if (!audit.social.twitterCard) add("Add a Twitter Card (summary_large_image).", "Enables large-image previews on X/Twitter.");
  if (!audit.social.favicon) add("Add a favicon link.", "Improves brand recognition in tabs and bookmarks.");

  // Document
  if (!audit.document.langPresent) add('Set <html lang="…">.', "Accessibility and correct language targeting.");

  // Brand / About heuristics
  const hasAbout = !!aboutText && aboutText.trim().length > 20;
  const hasNAP = /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(aboutText) || /(street|st\.|avenue|ave\.|road|rd\.|suite|ste\.|boulevard|blvd\.)/i.test(aboutText);
  if (hasAbout) add("Add Organization/LocalBusiness schema using About details.", "Clarifies entity info for Knowledge Graph and local packs.");
  if (hasNAP) add("Ensure NAP (name, address, phone) is consistent site-wide.", "Consistency strengthens local SEO and reduces confusion.");
  if (!hasAbout) add("Add a short brand POV (About us) block.", "Original brand context raises E-E-A-T and de-duplicates content.");

  return items;
}
