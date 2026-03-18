import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { type, keyword, title, tone = "profesional", wordCount = 800, clientName, wpTheme } = await req.json();

    if (!keyword) return NextResponse.json({ error: "Palabra clave requerida" }, { status: 400 });

    let prompt = "";

    if (type === "article") {
      prompt = `Eres un experto en SEO y redacción de contenido. Escribe un artículo de blog en español optimizado para SEO.

Empresa/cliente: ${clientName || "la empresa"}
Palabra clave principal: ${keyword}
Título sugerido: ${title || `Guía completa sobre ${keyword}`}
Tono: ${tone}
Extensión: aproximadamente ${wordCount} palabras

Genera el artículo con esta estructura:
- Título H1 optimizado con la keyword
- Introducción (150 palabras)
- Al menos 3 secciones con subtítulos H2 relevantes
- Conclusión con CTA
- Meta título (máx 60 chars)
- Meta descripción (máx 160 chars)

Formato de respuesta JSON:
{
  "title": "H1 title",
  "metaTitle": "...",
  "metaDescription": "...",
  "content": "Full HTML content with h2/h3/p tags",
  "slug": "url-slug",
  "excerpt": "Short excerpt 150 chars"
}`;
    } else if (type === "product") {
      prompt = `Eres un experto en SEO para ecommerce. Escribe una descripción de producto optimizada para SEO.

Producto: ${keyword}
Empresa: ${clientName || "la tienda"}
Tono: ${tone}

Genera la descripción con:
- Título del producto optimizado (H1)
- Descripción corta (2-3 oraciones, para excerpt)
- Descripción larga detallada (300-500 palabras con beneficios, características, uso)
- Meta título y meta descripción
- Tags SEO sugeridos

Responde en JSON:
{
  "title": "...",
  "shortDescription": "...",
  "longDescription": "HTML content",
  "metaTitle": "...",
  "metaDescription": "...",
  "tags": ["tag1", "tag2"]
}`;
    } else {
      prompt = `Genera contenido SEO optimizado en español para: ${keyword}. Cliente: ${clientName}. Tono: ${tone}.`;
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    // Try to parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return NextResponse.json({ ...parsed, raw: responseText });
    }

    return NextResponse.json({ content: responseText, raw: responseText });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
