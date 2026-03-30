import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function truncate(text: string, max: number): string {
  if (!text) return "";
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

export async function POST(req: NextRequest) {
  try {
    const { title, content, currentSeoTitle, currentMetaDesc, currentKeyword, instructions, clientName } = await req.json();

    if (!instructions?.trim()) return NextResponse.json({ error: "instructions requerido" }, { status: 400 });

    const strippedContent = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 3000);

    const prompt = `Eres experto en SEO y redacción web. Mejora el contenido y los campos SEO de esta página de WordPress.

Página: "${title}"
Cliente: ${clientName || "el cliente"}

Instrucciones del usuario: ${instructions}

Contenido actual (extracto):
${strippedContent || "(sin contenido)"}

SEO actual:
- Keyword: ${currentKeyword || "(sin definir)"}
- Título SEO: ${currentSeoTitle || "(sin definir)"}
- Meta descripción: ${currentMetaDesc || "(sin definir)"}

Devuelve SOLO este JSON válido (sin markdown):
{
  "focusKeyword": "keyword de 2-4 palabras más buscada para esta página",
  "seoTitle": "EXACTAMENTE 50-60 caracteres. Keyword al inicio + diferenciador",
  "metaDescription": "EXACTAMENTE 140-155 caracteres. Keyword + beneficio + CTA",
  "content": "<HTML completo mejorado con h1, h2, h3, párrafos enriquecidos y keyword integrada naturalmente. Mínimo 500 palabras.>"
}

CRÍTICO:
- seoTitle: entre 50-60 caracteres
- metaDescription: entre 140-155 caracteres
- content: HTML válido mejorado con la keyword integrada en título, subtítulos y contenido`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("No se pudo parsear el JSON de la IA");
    const result = JSON.parse(cleaned.slice(start, end + 1));

    return NextResponse.json({
      focusKeyword: String(result.focusKeyword || "").slice(0, 100),
      seoTitle: truncate(String(result.seoTitle || ""), 60),
      metaDescription: truncate(String(result.metaDescription || ""), 160),
      content: String(result.content || ""),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
