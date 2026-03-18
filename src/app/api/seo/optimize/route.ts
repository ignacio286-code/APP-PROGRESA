import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { items, instructions, clientName } = await req.json();

    if (!items?.length) {
      return NextResponse.json({ error: "No hay items seleccionados" }, { status: 400 });
    }

    const itemList = items
      .map((item: { id: number; title: string; type: string; link: string }, i: number) =>
        `${i + 1}. [ID:${item.id}] "${item.title}" (${item.type}) — ${item.link}`
      )
      .join("\n");

    const prompt = `Eres un experto en SEO especializado en Rank Math para WordPress.
Genera datos SEO optimizados para cada página/producto del cliente "${clientName || "el cliente"}".

Instrucciones del usuario: ${instructions}

Elementos a optimizar:
${itemList}

Para cada elemento devuelve:
- seoTitle: título SEO (máx 60 caracteres, incluye keyword principal, atractivo para clicks)
- metaDescription: meta descripción (máx 160 caracteres, persuasiva, incluye keyword y llamada a la acción)
- focusKeyword: palabra clave principal (1-4 palabras, término más buscado para ese contenido)
- schema: tipo de schema más apropiado (uno de: Article, Product, LocalBusiness, WebPage, FAQPage, HowTo, Service, Organization)

Responde ÚNICAMENTE con un JSON array válido, sin texto adicional, sin markdown:
[{"id": 123, "seoTitle": "...", "metaDescription": "...", "focusKeyword": "...", "schema": "Article"}, ...]`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "La IA no devolvió JSON válido" }, { status: 500 });
    }

    const results = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
