import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface CategoryInput {
  id: number;
  name: string;
}

async function generateCategorySEO(name: string, clientName?: string) {
  const prompt = `Eres un experto en SEO para ecommerce. Genera contenido SEO optimizado para esta categoría de productos en español.

Categoría: "${name}"
Tienda: ${clientName || "la tienda"}

Responde SOLO con este JSON (sin markdown):
{
  "metaTitle": "SEO title máx 60 chars con el nombre de la categoría y power word",
  "metaDescription": "Meta description máx 160 chars persuasiva con CTA y la keyword",
  "focusKeyword": "${name}",
  "description": "Descripción HTML 150-300 palabras para la categoría. Incluir la keyword '${name}' de forma natural, mencionar beneficios de los productos de esta categoría."
}`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1000,
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
    }> = [];

    for (const cat of categories) {
      try {
        // 1. Generate SEO content with AI
        const seo = await generateCategorySEO(cat.name, clientName);

        // 2. Update WooCommerce category description
        await wpDirect(wpUrl, wpUsername, wpAppPassword, "wc/v3", `products/categories/${cat.id}`, "PUT", {
          description: seo.description,
        });

        // 3. Update RankMath meta for taxonomy term (requires PHP snippet in WordPress)
        try {
          await wpDirect(wpUrl, wpUsername, wpAppPassword, "wp/v2", `product_cat/${cat.id}`, "POST", {
            meta: {
              rank_math_title: seo.metaTitle,
              rank_math_description: seo.metaDescription,
              rank_math_focus_keyword: seo.focusKeyword || cat.name,
            },
          });
        } catch {
          // RankMath term meta snippet may not be installed — description still saved
        }

        results.push({
          id: cat.id,
          name: cat.name,
          success: true,
          metaTitle: seo.metaTitle,
          metaDescription: seo.metaDescription,
          focusKeyword: seo.focusKeyword || cat.name,
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
