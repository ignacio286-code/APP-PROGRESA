import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { clientName, campaignType, product, goal, dailyBudget, targetLocation } = await req.json();

    const prompt = `Eres un experto certificado en Google Ads.
Genera un plan completo de campaña de Google Ads en español.

Cliente: ${clientName}
Tipo de campaña: ${campaignType}
Producto/Servicio: ${product}
Objetivo: ${goal}
Presupuesto diario: $${dailyBudget}
Ubicación: ${targetLocation || "Colombia, México, España"}

Responde SOLO con JSON válido:
{
  "campaignName": "Nombre descriptivo",
  "campaignType": "${campaignType}",
  "keywords": [
    {"keyword": "palabra clave exacta", "matchType": "Exacta|Frase|Amplia", "bidSuggestion": 1.50},
    {"keyword": "otra keyword", "matchType": "Frase", "bidSuggestion": 1.20}
  ],
  "adGroups": [
    {"name": "Grupo 1", "keywords": ["kw1", "kw2"]},
    {"name": "Grupo 2", "keywords": ["kw3", "kw4"]}
  ],
  "ads": [
    {
      "headline1": "Headline 1 (max 30 chars)",
      "headline2": "Headline 2 (max 30 chars)",
      "headline3": "Headline 3 (max 30 chars)",
      "description1": "Descripción 1 (max 90 chars)",
      "description2": "Descripción 2 (max 90 chars)",
      "displayUrl": "ejemplo.com/producto"
    }
  ],
  "extensions": [
    {"type": "Sitelink", "content": "Texto del sitelink"},
    {"type": "Callout", "content": "Texto del callout"},
    {"type": "Call", "content": "+57 300 123 4567"}
  ],
  "targetLocations": ["Colombia", "México"],
  "budget": {"daily": ${dailyBudget}, "bidStrategy": "CPC manual|CPA objetivo|ROAS objetivo"},
  "estimatedClicks": "200-500 clics/día",
  "estimatedCPC": "$0.80-$1.50"
}`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No se pudo generar el plan");

    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
