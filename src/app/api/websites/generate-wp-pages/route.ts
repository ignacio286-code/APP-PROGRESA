import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function toSlug(text: string): string {
  return text.toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

function truncate(text: string, max: number): string {
  if (!text) return "";
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

const TEMPLATE_PROMPTS: Record<string, string> = {
  home: "Página de Inicio — presentación principal, propuesta de valor, beneficios clave, CTA",
  about: "Quiénes Somos — historia, misión, visión, valores, equipo",
  services: "Servicios — lista detallada de servicios con descripción y beneficios",
  contact: "Contacto — información de contacto, horarios, formulario de contacto",
  blog: "Blog / Noticias — introducción a la sección de blog con categorías principales",
};

export async function POST(req: NextRequest) {
  try {
    const { businessDesc, businessName, targetCity, templates, clientName } = await req.json() as {
      businessDesc: string;
      businessName?: string;
      targetCity?: string;
      templates: string[];
      clientName?: string;
    };

    if (!businessDesc?.trim()) return NextResponse.json({ error: "businessDesc requerido" }, { status: 400 });
    if (!templates?.length) return NextResponse.json({ error: "templates requerido" }, { status: 400 });

    const name = businessName || clientName || "el negocio";
    const city = targetCity ? ` en ${targetCity}` : "";

    const templateList = templates.map(t => TEMPLATE_PROMPTS[t] || t).join("\n");

    const prompt = `Eres experto en SEO y redacción web para negocios. Genera páginas web completas en español para el siguiente negocio.

Negocio: "${name}"${city}
Descripción: ${businessDesc}

Genera las siguientes páginas:
${templateList}

Para cada página devuelve un JSON array con este formato exacto:
[
  {
    "title": "Título de la página",
    "slug": "slug-de-la-pagina",
    "focusKeyword": "keyword principal 2-4 palabras",
    "seoTitle": "Título SEO exactamente entre 50-60 caracteres con keyword",
    "metaDescription": "Meta descripción exactamente entre 140-155 caracteres con keyword y CTA",
    "content": "<HTML completo de la página con h1, h2, h3, párrafos y listas. Mínimo 400 palabras. Usar keyword naturalmente.>"
  }
]

CRÍTICO:
- seoTitle: 50-60 caracteres exactos
- metaDescription: 140-155 caracteres exactos
- slug: solo letras minúsculas, números y guiones
- content: HTML válido con al menos 400 palabras, keyword en H1, H2 y primeros párrafos
- Responde SOLO con el JSON array, sin texto adicional ni markdown`;

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    if (start === -1 || end === -1) throw new Error("No se pudo parsear el JSON de la IA");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pages = JSON.parse(text.slice(start, end + 1)) as any[];

    const processed = pages.map(p => ({
      title: String(p.title || ""),
      slug: p.slug ? toSlug(p.slug) : toSlug(p.title || "pagina"),
      focusKeyword: String(p.focusKeyword || "").slice(0, 100),
      seoTitle: truncate(String(p.seoTitle || p.title || ""), 60),
      metaDescription: truncate(String(p.metaDescription || ""), 160),
      content: String(p.content || ""),
    }));

    return NextResponse.json({ pages: processed });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
