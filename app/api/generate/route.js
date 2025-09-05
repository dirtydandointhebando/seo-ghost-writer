import { NextResponse } from "next/server";
import { z } from "zod";

const Body = z.object({
  url: z.string().url().optional(),
  topic: z.string().min(3),
  type: z.enum(["blog","service"]),
  tone: z.string().default("Professional"),
  wordCount: z.number().min(300).max(2000).default(800),
  cta: z.string().default("Contact us"),
  interlink: z.string().optional()
});

function stubTemplate({ topic, type, tone, wordCount, cta, interlink }) {
  const h1 = type === "blog" ? `${topic[0].toUpperCase()+topic.slice(1)}` : `Professional ${topic}`;
  const h2a = type === "blog" ? "What You Need to Know" : "Our Services";
  const h2b = type === "blog" ? "How It Works" : "Why Choose Us";
  const h2c = "FAQs";
  const link = interlink ? `

For more details, see our service page: ${interlink}` : "";
  const toneLine = `*Tone: ${tone}*`;

  const para = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet.";
  const words = Math.max(2, Math.floor(wordCount/100));
  const body = Array.from({length: words}, () => para).join("\n\n");

  return `# ${h1}\n\n${toneLine}\n\n## ${h2a}\n${body}\n\n## ${h2b}\n${body}\n\n## ${h2c}\n- Q: Common question about ${topic}?\n  A: Brief, helpful answer.\n- Q: Another FAQ?\n  A: Short, clear reply.${link}\n\n---\n**Call to Action:** ${cta}`;
}

async function openaiTemplate(args) {
  const key = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  if (!key) return stubTemplate(args);

  const system = "You write SEO-friendly web copy with clear structure (H1, H2, FAQs, CTA) and natural internal linking when a target URL is provided.";
  const user = `Write a ${args.type} draft about: "${args.topic}". Tone: ${args.tone}. Target length: ${args.wordCount} words. CTA: ${args.cta}. Interlink target (optional): ${args.interlink || "none"}. Return markdown.`;

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
          { role: "system", content: system },
          { role: "user", content: user }
        ],
        temperature: 0.7
      })
    });
    const json = await res.json();
    const text = json.choices?.[0]?.message?.content;
    if (!text) return stubTemplate(args);
    return text;
  } catch {
    return stubTemplate(args);
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const args = Body.parse(body);
    const md = await openaiTemplate(args);
    return NextResponse.json({ html: md });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Invalid request" }, { status: 400 });
  }
}
