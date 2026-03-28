import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface ProductInput {
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

async function generateProductSEO(name: string, clientName?: string) {
  const slugBase = toSlug(name);
  const prompt = `Eres un experto en SEO para ecommerce. Genera contenido SEO completo y optimizado para este producto en español. Cumple estrictamente con todos los criterios de Rank Math.

Producto: "${name}"
Tienda: ${clientName || "la tienda"}
Slug sugerido como base: "${slugBase}"

Responde SOLO con este JSON (sin markdown, sin texto extra):
{
  "metaTitle": "Título SEO de 50-60 caracteres. Incluye la keyword al inicio, una power word y número si aplica. Ej: 'Mejores Ruedas para Transpaleta Chile | Envío Gratis'",
  "metaDescription": "Meta descripción de 140-160 caracteres. Incluye la keyword, propuesta de valor y CTA. Ej: 'Compra ruedas para transpaleta de alta resistencia en Chile. Envío en 24h, garantía de 2 años. ¡Cotiza ahora!'",
  "focusKeyword": "keyword principal exacta de 2-4 palabras muy buscadas para este producto",
  "slug": "url-seo-del-producto-con-keyword-principal-en-guiones",
  "ogTitle": "Título para redes sociales (igual o similar al metaTitle)",
  "ogDescription": "Descripción para redes sociales (igual o similar al metaDescription)",
  "schema": "Product",
  "shortDescription": "Descripción corta HTML de 2-3 oraciones. Incluye la keyword de forma natural.",
  "description": "Descripción larga HTML de 400-600 palabras. Estructura: <h2> con keyword, párrafo introductorio con keyword, <h3> Características, <ul> con 5-7 beneficios clave (cada uno menciona variaciones de keyword), <h3> ¿Por qué elegirnos?, párrafo final con CTA. La keyword debe aparecer al menos 5 veces de forma natural."
}`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
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
    const { products, wpUrl, wpUsername, wpAppPassword, clientName } = await req.json() as {
      products: ProductInput[];
      wpUrl: string;
      wpUsername: string;
      wpAppPassword: string;
      clientName?: string;
    };

    if (!products?.length) return NextResponse.json({ error: "products requerido" }, { status: 400 });
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

    for (const product of products) {
      try {
        // 1. Generate complete SEO content with AI
        const seo = await generateProductSEO(product.name, clientName);

        const slug = seo.slug || toSlug(seo.focusKeyword || product.name);

        // 2. Update WooCommerce product: description, short description, and slug
        await wpDirect(wpUrl, wpUsername, wpAppPassword, "wc/v3", `products/${product.id}`, "POST", {
          description: seo.description,
          short_description: seo.shortDescription,
          slug,
        });

        // 3. Update RankMath meta + slug via wp/v2 (requires PHP snippet in WordPress)
        try {
          await wpDirect(wpUrl, wpUsername, wpAppPassword, "wp/v2", `product/${product.id}`, "POST", {
            slug,
            meta: {
              rank_math_title: seo.metaTitle,
              rank_math_description: seo.metaDescription,
              rank_math_focus_keyword: seo.focusKeyword || product.name,
              rank_math_rich_snippet: "Product",
              rank_math_og_title: seo.ogTitle || seo.metaTitle,
              rank_math_og_description: seo.ogDescription || seo.metaDescription,
              rank_math_twitter_title: seo.ogTitle || seo.metaTitle,
              rank_math_twitter_description: seo.ogDescription || seo.metaDescription,
            },
          });
        } catch {
          // RankMath snippet may not be installed — content + slug still saved via WC endpoint
        }

        results.push({
          id: product.id,
          name: product.name,
          success: true,
          metaTitle: seo.metaTitle,
          metaDescription: seo.metaDescription,
          focusKeyword: seo.focusKeyword || product.name,
          slug,
        });
      } catch (err) {
        results.push({
          id: product.id,
          name: product.name,
          success: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const succeeded = results.filter((r) => r.success).length;
    return NextResponse.json({ results, succeeded, total: products.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
