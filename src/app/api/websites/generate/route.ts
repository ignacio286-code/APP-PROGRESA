import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { type, clientName, businessDescription, pages, tone, storeType } = await req.json();

    if (type === "informative") {
      const pageList = pages || ["Inicio", "Nosotros", "Servicios", "Contacto"];

      const prompt = `Eres un experto en diseño web y SEO. Genera el contenido completo para un sitio web informativo en WordPress.

Empresa: ${clientName}
Descripción del negocio: ${businessDescription}
Tono: ${tone || "profesional"}
Páginas a generar: ${pageList.join(", ")}

Para cada página, genera contenido HTML rico con etiquetas h2, h3, p, ul, etc.

Responde SOLO con JSON válido:
{
  "siteName": "${clientName} - Sitio oficial",
  "theme": "Tema WordPress genérico",
  "menuStructure": ${JSON.stringify(pageList)},
  "globalMeta": {
    "title": "${clientName} | título corto",
    "description": "meta descripción del sitio (155 chars)",
    "keywords": ["keyword1", "keyword2", "keyword3"]
  },
  "pages": [
    {
      "pageName": "Nombre de la página",
      "slug": "url-slug",
      "seoTitle": "Título SEO optimizado (60 chars max)",
      "metaDescription": "Meta descripción (155 chars max)",
      "content": "<h2>Bienvenidos</h2><p>Contenido HTML rico aquí...</p>",
      "sections": ["Hero", "Servicios", "CTA"]
    }
  ]
}

Genera content HTML completo y detallado para cada página, mínimo 400 palabras por página.`;

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      });

      const text = message.content[0].type === "text" ? message.content[0].text : "{}";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No se pudo generar la estructura del sitio");

      return NextResponse.json(JSON.parse(jsonMatch[0]));
    }

    if (type === "ecommerce") {
      const prompt = `Genera una estructura completa de tienda WooCommerce en español para ${clientName}.
Tipo de tienda: ${storeType}
Descripción: ${businessDescription}

Responde en JSON:
{
  "storeName": "...",
  "categories": [{"name": "Categoría", "description": "...", "slug": "slug"}],
  "pages": [{"name": "Tienda", "content": "HTML..."}, {"name": "Sobre nosotros", "content": "HTML..."}],
  "settings": {
    "currency": "USD",
    "shippingZones": ["Colombia", "México"],
    "paymentMethods": ["PayPal", "Stripe", "Transferencia bancaria"]
  },
  "sampleProducts": [
    {"name": "Producto ejemplo", "category": "...", "price": 99, "description": "..."}
  ]
}`;

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      });

      const text = message.content[0].type === "text" ? message.content[0].text : "{}";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No se pudo generar la estructura");

      return NextResponse.json(JSON.parse(jsonMatch[0]));
    }

    return NextResponse.json({ error: "Tipo no soportado" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
