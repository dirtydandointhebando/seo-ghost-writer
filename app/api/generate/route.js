import { NextResponse } from "next/server";
import { z } from "zod";
import { googleSuggest } from "@/lib/topics";

const Body = z.object({
  url: z.string().url().optional(),
  topic: z.string().min(3),
  type: z.enum(["blog","service"]),
  tone: z.string().default("Professional"),
  wordCount: z.number().min(300).max(2000).default(800),
  cta: z.string().default("Contact us"),
  interlink: z.string().optional()
});

function fallbackTemplate({ topic, type, tone, wordCount, cta, interlink }) {
  const link = interlink ? `\n\nFor more details, see our service page: ${interlink}` : "";
  return `# ${topic}\n\n*Tone: ${tone}*\n\n## Overview\n[RESEARCH NEEDED] Provide a concise overview.\n\n## Key Points\n- [RESEARCH NEEDED]\n- [RESEARCH NEEDED]\n\n## FAQs\n- Q: Common question?\n  A: Helpful answer.\n${link}\n\n---\n**Call to Action:** ${cta}`;
}

async function openaiDraft(args, suggestHints = []) {
  const key = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  if (!key) return fallbackTemplate(args);

  const rules = `
You are an SEO copy specialist. Write ORIGINAL, non-copied text. Do not repeat or closely paraphrase any single source.
If you are unsure of a factual claim, insert [RESEARCH NEEDED] instead of guessing.
Structure:
- Use a single H1 as the title.
- Use H2s/H3s to cover subtopics. Include an FAQ section.
- End with a clear CTA block using the provided CTA text.
Interlinking:
- If an internal link target URL is provided, add ONE natural internal link in context (do not force it).
Quality:
- Be specific, avoid fluff. Prefer short paragraphs and scannable lists.
- Reflect the requested tone.
Local signals (if the topic includes a city/region): include a light local angle without keyword stuffing.
Compliance:
- For legal/financial/medical topics, add a one-line non-advice disclaimer near the end.
`;

  const hintsText = suggestHints.length
    ? `Related queries people search:\n- ${suggestHints.slice(0,6).join("\n- ")}`
    : "";

  const user = `
Write a ${args.type} draft about: "${args.topic}".
Target length: ~${args.wordCount} words. Tone: ${args.tone}. CTA: ${args.cta}.
Interlink (optional): ${args.interlink || "none"}.
${hintsText}
Return **markdown** with a single H1 title, clear H2/H3 sections, an FAQ, one natural internal link if applicable, and the CTA as a final section.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: rules },
          { role: "user", content: user }
        ],
        temperature: 0.7
      })
    });
    const json = await res.json();
    const text = json.choices?.[0]?.message?.content;
    return text || fallbackTemplate(args);
  } catch {
    return fallbackTemplate(args);
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const args = Body.parse(body);

    // seed with real subtopics from Google Autocomplete (best-effort)
    let hints = [];
    try {
      const base = await googleSuggest(args.topic);
      const plusHow = await googleSuggest("how " + args.topic);
      const plusCost = await googleSuggest("cost " + args.topic);
      hints = [...new Set([...(base||[]), ...(plusHow||[]), ...(plusCost||[])])].slice(0, 8);
    } catch {}

    const md = await openaiDraft(args, hints);
    return NextResponse.json({ html: md });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Invalid request" }, { status: 400 });
  }
}
