import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface ProductInput {
  id: number;
  name: string;
}

async function generateProductSEO(name: string, clientName?: string) {
  const prompt = `Eres un experto en SEO para ecommerce. Genera contenido SEO optimizado para este producto en español.

Producto: "${name}"
Tienda: ${clientName || "la tienda"}

Responde SOLO con este JSON (sin markdown):
{
  "metaTitle": "SEO title máx 60 chars con el nombre del producto y power word",
  "metaDescription": "Meta description máx 160 chars persuasiva con CTA",
  "focusKeyword": "${name}",
  "shortDescription": "Descripción corta 2-3 oraciones sobre el producto",
  "description": "Descripción larga HTML 300-500 palabras con h3, p, ul para beneficios y características del producto. Incluir la keyword '${name}' de forma natural varias veces."
}`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No se pudo parsear el JSON de la IA");
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function wpFetch(
  wpUrl: string, wpUsername: string, wpAppPassword: string,
  apiNamespace: string, endpoint: string, method: string, body: Record<string, unknown>
) {
  const res = await fetch(`${BASE_URL}/api/wordpress`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wpUrl, wpUsername, wpAppPassword, apiNamespace, endpoint, method, body }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
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
    }> = [];

    for (const product of products) {
      try {
        // 1. Generate SEO content
        const seo = await generateProductSEO(product.name, clientName);

        // 2. Update WooCommerce description
        await wpFetch(wpUrl, wpUsername, wpAppPassword, "wc/v3", `products/${product.id}`, "POST", {
          description: seo.description,
          short_description: seo.shortDescription,
        });

        // 3. Update RankMath meta (requires PHP snippet in WP)
        try {
          await wpFetch(wpUrl, wpUsername, wpAppPassword, "wp/v2", `product/${product.id}`, "POST", {
            meta: {
              rank_math_title: seo.metaTitle,
              rank_math_description: seo.metaDescription,
              rank_math_focus_keyword: seo.focusKeyword || product.name,
              rank_math_rich_snippet: "Product",
            },
          });
        } catch {
          // RankMath snippet may not be installed — content still saved
        }

        results.push({
          id: product.id,
          name: product.name,
          success: true,
          metaTitle: seo.metaTitle,
          metaDescription: seo.metaDescription,
          focusKeyword: seo.focusKeyword || product.name,
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
