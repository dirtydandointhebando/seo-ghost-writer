import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchHtml, runBasicAudit } from "@/lib/audit";
import * as cheerio from "cheerio";
import { suggestTopicsFromKeywords } from "@/lib/topics";

const Body = z.object({
  url: z.string().url(),
  keywords: z.array(z.string()).max(3).optional()
});

export async function POST(req) {
  try {
    const body = await req.json();
    const { url, keywords = [] } = Body.parse(body);

    const { html, status, headers, finalUrl } = await fetchHtml(url);
    const audit = await runBasicAudit(html, url, { status, headers, finalUrl });

    // try to read page title to enrich topics
    const $ = cheerio.load(html);
    const pageTitle = $("head > title").text().trim();
    const topics = suggestTopicsFromKeywords(keywords, pageTitle);

    const report = {
      reportId: Math.random().toString(36).slice(2),
      audit,
      topics
    };

    return NextResponse.json(report);
  } catch (e) {
    return NextResponse.json({ error: e.message || "Invalid request" }, { status: 400 });
  }
}
