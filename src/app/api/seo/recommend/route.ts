import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

function getAnthropic() { return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }); }

export async function POST(req: NextRequest) {
  try {
    const { item, clientName } = await req.json();
    const { seoTitle, metaDescription, focusKeyword, schema, content, link, title } = item;

    const prompt = `Eres un experto SEO especializado en Rank Math para WordPress con 10 años de experiencia posicionando sitios en Chile y Latinoamérica.

Analiza esta página/producto y genera las correcciones exactas para que obtenga 100/100 en Rank Math.

Cliente: ${clientName || "el cliente"}
Página: ${title}
URL: ${link}

DATOS SEO ACTUALES:
- Título SEO: "${seoTitle || "(vacío)"}"
- Meta Descripción: "${metaDescription || "(vacío)"}"
- Keyword Principal: "${focusKeyword || "(vacío)"}"
- Schema: "${schema || "(ninguno)"}"

CONTENIDO HTML ACTUAL:
${content ? content.substring(0, 4000) : "(sin contenido — necesita generarse)"}

INSTRUCCIONES:
Analiza TODOS estos criterios de Rank Math. Para cada uno que falle, incluye un fix con el valor exacto corregido:

1. focusKeyword — la keyword más buscada y relevante para esta URL/producto
2. seoTitle — contiene keyword, 40-60 chars, keyword al inicio, tiene power word y/o número
3. metaDescription — contiene keyword, 120-160 chars, persuasiva, con llamada a la acción
4. schema — tipo más apropiado (Product, Service, Article, LocalBusiness, WebPage, etc.)
5. content — al menos 600 palabras, keyword en primer párrafo, keyword en H2/H3, estructura con headings

Responde ÚNICAMENTE con JSON válido sin texto adicional:
{
  "summary": "Diagnóstico experto en 2 líneas de qué necesita esta página para posicionar",
  "fixes": [
    {
      "check": "nombre exacto del criterio Rank Math",
      "issue": "qué está fallando actualmente (máx 120 chars)",
      "advice": "consejo experto específico para este caso (máx 160 chars)",
      "field": "focusKeyword|seoTitle|metaDescription|schema|content",
      "value": "valor exacto y completo para aplicar"
    }
  ],
  "contentFull": "Si el contenido necesita reescritura o es muy corto (< 300 palabras): HTML completo optimizado con al menos 600 palabras, keyword en primer párrafo, H2 con keyword, H3 de subtemas, párrafos ricos con la keyword natural. Si el contenido ya es suficiente, pon null aquí."
}

IMPORTANTE:
- El campo "value" de "content" debe ser solo los cambios al inicio (primer párrafo optimizado), NO el contenido completo — ese va en "contentFull"
- Si "contentFull" tiene valor, se usará como el contenido completo reemplazando el actual
- Sé específico con los valores: no pongas ejemplos genéricos, usa el nombre real del producto/página/empresa`;

    const message = await getAnthropic().messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "La IA no devolvió JSON válido" }, { status: 500 });
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
