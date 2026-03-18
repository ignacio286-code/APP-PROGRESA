import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { clientName, goal, product, targetAudience, dailyBudget, duration } = await req.json();

    const prompt = `Eres un experto en publicidad digital de Meta (Facebook e Instagram).
Crea un plan detallado de campaña publicitaria en español.

Cliente: ${clientName}
Objetivo: ${goal}
Producto/Servicio: ${product}
Audiencia: ${targetAudience || "general"}
Presupuesto diario: $${dailyBudget}
Duración: ${duration} días

Responde SOLO con JSON válido en este formato exacto:
{
  "campaignName": "Nombre descriptivo de la campaña",
  "objective": "CONVERSIONS|REACH|TRAFFIC|LEAD_GENERATION|MESSAGES",
  "audience": {
    "ageMin": 25,
    "ageMax": 45,
    "gender": "Todos|Hombres|Mujeres",
    "interests": ["interés 1", "interés 2", "interés 3", "interés 4"],
    "locations": ["País o Ciudad 1", "País o Ciudad 2"]
  },
  "budget": {
    "daily": ${dailyBudget},
    "currency": "USD",
    "duration": ${duration}
  },
  "adCopy": {
    "headline": "Título principal llamativo (max 40 chars)",
    "primaryText": "Texto principal del anuncio persuasivo (2-3 oraciones)",
    "description": "Descripción breve complementaria",
    "cta": "Comprar ahora|Saber más|Registrarse|Contactar|Ver oferta"
  },
  "placements": ["Facebook Feed", "Instagram Feed", "Instagram Stories", "Facebook Stories"],
  "estimatedReach": "50,000-150,000 personas"
}`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No se pudo generar el plan de campaña");

    const plan = JSON.parse(jsonMatch[0]);
    return NextResponse.json(plan);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
