import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

function getAnthropic() { return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }); }

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

function truncate(text: string, max: number): string {
  if (!text) return "";
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

async function generateProductSEO(name: string, clientName?: string) {
  const slugBase = toSlug(name);
  const prompt = `Eres experto en SEO para ecommerce. Genera SEO completo en español cumpliendo EXACTAMENTE los límites de caracteres indicados.

Producto: "${name}"
Tienda: ${clientName || "la tienda"}
Slug base: "${slugBase}"

Responde SOLO con JSON válido (sin markdown):
{
  "metaTitle": "EXACTAMENTE entre 50-60 caracteres. Keyword al inicio + power word. Ej: 'Tornillo Turbo 140mm | Mejor Precio Chile'",
  "metaDescription": "EXACTAMENTE entre 140-155 caracteres. Keyword + beneficio + CTA. Ej: 'Tornillo turbo 140mm de alta resistencia para construcción. Envío en 24h, garantía incluida. ¡Compra ahora!'",
  "focusKeyword": "keyword de 2-4 palabras, la más buscada para este producto",
  "slug": "keyword-principal-del-producto-en-guiones",
  "shortDescription": "<p>2 oraciones. Keyword natural incluida.</p>",
  "description": "<h2>Keyword al inicio</h2><p>Párrafo intro con keyword.</p><h3>Características</h3><ul><li>Beneficio 1 con keyword</li><li>Beneficio 2</li><li>Beneficio 3</li><li>Beneficio 4</li><li>Beneficio 5</li></ul><h3>¿Por qué elegirnos?</h3><p>Párrafo con keyword y CTA.</p>"
}

CRÍTICO: metaTitle debe tener entre 50-60 caracteres. metaDescription debe tener entre 140-155 caracteres. Cuenta los caracteres antes de responder.`;

  const message = await getAnthropic().messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No se pudo parsear el JSON de la IA");
  const seo = JSON.parse(cleaned.slice(start, end + 1));

  // Hard-enforce character limits
  seo.metaTitle = truncate(seo.metaTitle || name, 60);
  seo.metaDescription = truncate(seo.metaDescription || "", 160);
  seo.focusKeyword = (seo.focusKeyword || name).slice(0, 100);
  seo.slug = seo.slug ? toSlug(seo.slug) : toSlug(seo.focusKeyword || name);

  return seo;
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

        // 2. Update WooCommerce product via wc/v3 — supports meta_data without PHP snippets
        //    This writes ALL RankMath fields directly as post meta.
        await wpDirect(wpUrl, wpUsername, wpAppPassword, "wc/v3", `products/${product.id}`, "POST", {
          description: seo.description,
          short_description: seo.shortDescription,
          slug: seo.slug,
          meta_data: [
            { key: "rank_math_title",               value: seo.metaTitle },
            { key: "rank_math_description",         value: seo.metaDescription },
            { key: "rank_math_focus_keyword",       value: seo.focusKeyword },
            { key: "rank_math_rich_snippet",        value: "Product" },
            { key: "rank_math_og_title",            value: seo.metaTitle },
            { key: "rank_math_og_description",      value: seo.metaDescription },
            { key: "rank_math_twitter_title",       value: seo.metaTitle },
            { key: "rank_math_twitter_description", value: seo.metaDescription },
          ],
        });

        results.push({
          id: product.id,
          name: product.name,
          success: true,
          metaTitle: seo.metaTitle,
          metaDescription: seo.metaDescription,
          focusKeyword: seo.focusKeyword,
          slug: seo.slug,
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
