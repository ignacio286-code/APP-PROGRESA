import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface CategoryInput {
  id: number;
  name: string;
}

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

async function generateCategorySEO(name: string, clientName?: string) {
  const slugBase = toSlug(name);
  const prompt = `Eres un experto en SEO para ecommerce. Genera contenido SEO completo para esta categoría de productos en español. Cumple con todos los criterios de Rank Math.

Categoría: "${name}"
Tienda: ${clientName || "la tienda"}
Slug sugerido como base: "${slugBase}"

Responde SOLO con este JSON (sin markdown, sin texto extra):
{
  "metaTitle": "Título SEO de 50-60 caracteres. Incluye la keyword al inicio y power word. Ej: 'Transpaletas Eléctricas en Chile | Mejor Precio'",
  "metaDescription": "Meta descripción de 140-160 caracteres. Incluye la keyword, beneficios y CTA. Ej: 'Encuentra las mejores transpaletas eléctricas en Chile. Amplio stock, garantía y envío rápido. ¡Cotiza hoy!'",
  "focusKeyword": "keyword principal exacta de 2-4 palabras para esta categoría",
  "slug": "url-seo-de-la-categoria-con-keyword",
  "ogTitle": "Título para redes sociales",
  "ogDescription": "Descripción para redes sociales (140-160 chars)",
  "description": "Descripción HTML de 200-350 palabras para la categoría. Estructura: párrafo introductorio con la keyword, <h2> con variación de keyword, párrafo describiendo los productos, <ul> con 4-5 beneficios de comprar en esta categoría. La keyword debe aparecer al menos 4 veces."
}`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1200,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No se pudo parsear el JSON de la IA");
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function wpDirect(
  wpUrl: string, wpUsername: string, wpAppPassword: string,
  apiNamespace: string, endpoint: string, method: string, body: Record<string, unknown>
) {
  const base = wpUrl.replace(/\/$/, "");
  const url = `${base}/wp-json/${apiNamespace}/${endpoint}`;
  const credentials = Buffer.from(`${wpUsername}:${wpAppPassword}`).toString("base64");
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WordPress ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const { categories, wpUrl, wpUsername, wpAppPassword, clientName } = await req.json() as {
      categories: CategoryInput[];
      wpUrl: string;
      wpUsername: string;
      wpAppPassword: string;
      clientName?: string;
    };

    if (!categories?.length) return NextResponse.json({ error: "categories requerido" }, { status: 400 });
    if (!wpUrl || !wpUsername || !wpAppPassword) {
      return NextResponse.json({ error: "Credenciales WordPress requeridas" }, { status: 400 });
    }

    const results: Array<{
      id: number;
      name: string;
      success: boolean;
      error?: string;
      metaTitle?: string;
      metaDescription?: string;
      focusKeyword?: string;
      slug?: string;
    }> = [];

    for (const cat of categories) {
      try {
        // 1. Generate complete SEO content with AI
        const seo = await generateCategorySEO(cat.name, clientName);

        const slug = seo.slug || toSlug(seo.focusKeyword || cat.name);

        // 2. Update WooCommerce category: description and slug
        await wpDirect(wpUrl, wpUsername, wpAppPassword, "wc/v3", `products/categories/${cat.id}`, "PUT", {
          description: seo.description,
          slug,
        });

        // 3. Update RankMath meta for taxonomy term via wp/v2 (requires PHP snippet)
        try {
          await wpDirect(wpUrl, wpUsername, wpAppPassword, "wp/v2", `product_cat/${cat.id}`, "POST", {
            meta: {
              rank_math_title: seo.metaTitle,
              rank_math_description: seo.metaDescription,
              rank_math_focus_keyword: seo.focusKeyword || cat.name,
              rank_math_og_title: seo.ogTitle || seo.metaTitle,
              rank_math_og_description: seo.ogDescription || seo.metaDescription,
              rank_math_twitter_title: seo.ogTitle || seo.metaTitle,
              rank_math_twitter_description: seo.ogDescription || seo.metaDescription,
            },
          });
        } catch {
          // RankMath term meta snippet may not be installed — description + slug still saved
        }

        results.push({
          id: cat.id,
          name: cat.name,
          success: true,
          metaTitle: seo.metaTitle,
          metaDescription: seo.metaDescription,
          focusKeyword: seo.focusKeyword || cat.name,
          slug,
        });
      } catch (err) {
        results.push({
          id: cat.id,
          name: cat.name,
          success: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const succeeded = results.filter((r) => r.success).length;
    return NextResponse.json({ results, succeeded, total: categories.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
