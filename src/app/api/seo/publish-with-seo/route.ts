import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function inferWpType(type: string): string {
  if (type === "product") return "products";
  if (type === "page") return "pages";
  return "posts";
}

function parseJson(text: string) {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No se pudo parsear JSON");
  return JSON.parse(cleaned.slice(start, end + 1));
}

// STEP 1: generate metadata only (small JSON, no HTML)
async function generateMeta(params: {
  type: string; keyword: string; audience: string;
  objective: string; tone: string; wordCount: number; clientName: string;
}) {
  const { type, keyword, audience, objective, tone, wordCount, clientName } = params;

  const typeLabel = type === "article" ? "artículo de blog" : type === "page" ? "página web" : "producto";

  const prompt = `Eres un experto SEO. Genera los metadatos SEO para un ${typeLabel} en español.

Keyword: "${keyword}"
Cliente: ${clientName}
Audiencia: ${audience}
Objetivo: ${objective}
Tono: ${tone}
${type !== "product" ? `Extensión: ~${wordCount} palabras` : ""}

Responde ÚNICAMENTE con este JSON válido (sin HTML, sin texto extra):
{
  "title": "Título H1 con la keyword al inicio, máx 65 chars",
  "metaTitle": "SEO title máx 60 chars con keyword y power word",
  "metaDescription": "Meta description 150-160 chars, incluye keyword y CTA",
  "focusKeyword": "${keyword}",
  "slug": "url-slug-con-keyword-sin-acentos",
  "excerpt": "Resumen de 150 chars con la keyword",
  "shortDescription": "2-3 oraciones descriptivas con la keyword",
  "faq": [
    {"question": "Pregunta frecuente 1 sobre ${keyword}?", "answer": "Respuesta completa de 2-3 oraciones"},
    {"question": "Pregunta frecuente 2 sobre ${keyword}?", "answer": "Respuesta completa"},
    {"question": "Pregunta frecuente 3 sobre ${keyword}?", "answer": "Respuesta completa"},
    {"question": "Pregunta frecuente 4 sobre ${keyword}?", "answer": "Respuesta completa"}
  ]
}`;

  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1200,
    messages: [{ role: "user", content: prompt }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
  return parseJson(text);
}

// STEP 2: generate HTML content separately (plain HTML, no JSON)
async function generateHtmlContent(params: {
  type: string; keyword: string; audience: string;
  objective: string; tone: string; wordCount: number;
  clientName: string; title: string;
  faq: Array<{ question: string; answer: string }>;
}) {
  const { type, keyword, audience, objective, tone, wordCount, clientName, title, faq } = params;

  const kwSlug = keyword.toLowerCase().replace(/\s+/g, "-");

  let contentPrompt = "";

  if (type === "article") {
    contentPrompt = `Escribe el HTML completo de un artículo de blog SEO en español.

Título: "${title}"
Keyword principal: "${keyword}"
Cliente: ${clientName}
Audiencia: ${audience}
Objetivo: ${objective}
Tono: ${tone}
Extensión: ~${wordCount} palabras

REQUISITOS RANKMATH (todos obligatorios):
- Keyword "${keyword}" en los primeros 100 caracteres del cuerpo
- Keyword en al menos 2 subtítulos H2
- Densidad de keyword: 1-3%
- Tabla de contenidos al inicio con anclas (#seccion-1, #seccion-2, etc.)
- Al menos 4 secciones H2, cada una con al menos 1 H3
- Usa <strong> para enfatizar la keyword en el primer párrafo

IMÁGENES (incluye 3 imágenes con este formato exacto):
<figure class="wp-block-image size-large"><img src="https://picsum.photos/seed/${kwSlug}-1/1200/628" alt="${keyword} - descripción contextual 1" title="${keyword}" width="1200" height="628" loading="lazy" /><figcaption>${keyword}: descripción de la imagen 1</figcaption></figure>

ENLACES:
- 2 enlaces internos: <a href="/contacto">texto ancla relevante</a> y <a href="/servicios">texto</a>
- 2 enlaces externos a fuentes reales autoritativas: Wikipedia, organismos oficiales o estudios (href completo)

FAQ AL FINAL (usa este HTML exacto con estas preguntas):
<div class="faq-section">
<h2>Preguntas frecuentes sobre ${keyword}</h2>
${faq.map((f, i) => `<div class="faq-item"><h3>${f.question}</h3><p>${f.answer}</p></div>`).join("\n")}
</div>

Devuelve SOLO el HTML del cuerpo del artículo, sin <html>, sin <head>, sin JSON. Solo el contenido HTML.`;

  } else if (type === "page") {
    contentPrompt = `Escribe el HTML completo de una landing page SEO en español.

Título: "${title}"
Keyword: "${keyword}"
Cliente: ${clientName}
Audiencia: ${audience}
Objetivo: ${objective}
Tono: ${tone}
Extensión: ~${wordCount} palabras

REQUISITOS:
- Keyword en los primeros 100 chars, en 2 H2, densidad 1-3%
- 2 imágenes con formato:
<figure class="wp-block-image size-large"><img src="https://picsum.photos/seed/${kwSlug}-1/1200/628" alt="${keyword} - descripción" title="${keyword}" width="1200" height="628" loading="lazy" /><figcaption>descripción</figcaption></figure>
- 1 enlace interno y 1 externo autoritativo
- CTA claro al final
- FAQ al final:
<div class="faq-section"><h2>Preguntas frecuentes sobre ${keyword}</h2>
${faq.slice(0, 3).map((f) => `<div class="faq-item"><h3>${f.question}</h3><p>${f.answer}</p></div>`).join("\n")}
</div>

Devuelve SOLO el HTML del cuerpo, sin JSON.`;

  } else {
    contentPrompt = `Escribe el HTML completo de una descripción de producto SEO en español.

Producto: "${title}"
Keyword: "${keyword}"
Tienda: ${clientName}
Audiencia: ${audience}
Objetivo: ${objective}
Tono: ${tone}
Extensión: 400-600 palabras

REQUISITOS:
- Keyword en el primer párrafo (con <strong>), en 1 H2, densidad 1-3%
- 2 imágenes:
<figure class="wp-block-image size-large"><img src="https://picsum.photos/seed/${kwSlug}-1/800/800" alt="${keyword} - descripción" title="${keyword}" width="800" height="800" loading="lazy" /><figcaption>descripción</figcaption></figure>
- Lista de beneficios con <ul><li> incluyendo la keyword
- 1 enlace interno (/categoria/) y 1 externo autoritativo
- FAQ al final:
<div class="faq-section"><h2>Preguntas sobre ${keyword}</h2>
${faq.slice(0, 2).map((f) => `<div class="faq-item"><h3>${f.question}</h3><p>${f.answer}</p></div>`).join("\n")}
</div>

Devuelve SOLO el HTML, sin JSON.`;
  }

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 5000,
    messages: [{ role: "user", content: contentPrompt }],
  });

  const html = msg.content[0].type === "text" ? msg.content[0].text : "";
  // Strip any accidental markdown fences
  return html.replace(/^```(?:html)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
}

// Build JSON-LD schema object (NOT injected into content — stored as custom meta field)
function buildSchemaData(
  type: string,
  meta: Record<string, unknown>,
  keyword: string,
  clientName: string
): unknown[] {
  const now = new Date().toISOString();
  const faq = meta.faq as Array<{ question: string; answer: string }> | undefined;
  const schemas: unknown[] = [];

  if (type === "article") {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: meta.title,
      description: meta.metaDescription,
      image: {
        "@type": "ImageObject",
        url: `https://picsum.photos/seed/${encodeURIComponent(keyword)}/1200/628`,
        width: 1200,
        height: 628,
      },
      author: { "@type": "Organization", name: clientName },
      publisher: {
        "@type": "Organization",
        name: clientName,
        logo: { "@type": "ImageObject", url: `${BASE_URL}/logo.png` },
      },
      datePublished: now,
      dateModified: now,
      keywords: keyword,
      mainEntityOfPage: { "@type": "WebPage", "@id": `${BASE_URL}/${meta.slug}` },
      inLanguage: "es",
    });
  } else if (type === "page") {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: meta.title,
      description: meta.metaDescription,
      url: `${BASE_URL}/${meta.slug}`,
      publisher: { "@type": "Organization", name: clientName },
      inLanguage: "es",
      dateModified: now,
    });
  } else {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Product",
      name: meta.title,
      description: meta.shortDescription || meta.metaDescription,
      image: `https://picsum.photos/seed/${encodeURIComponent(keyword)}/800/800`,
      brand: { "@type": "Brand", name: clientName },
      offers: {
        "@type": "Offer",
        priceCurrency: "CLP",
        availability: "https://schema.org/InStock",
        seller: { "@type": "Organization", name: clientName },
      },
    });
  }

  // FAQPage schema alongside main schema
  if (faq && faq.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    });
  }

  return schemas;
}

async function callWordPressProxy(body: Record<string, unknown>) {
  const res = await fetch(`${BASE_URL}/api/wordpress`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

export async function POST(req: NextRequest) {
  try {
    const {
      wpUrl, wpUsername, wpAppPassword,
      keyword, type, audience, objective, tone, wordCount, clientName,
      destination,
    } = await req.json();

    if (!wpUrl || !wpUsername || !wpAppPassword) {
      return NextResponse.json({ error: "Credenciales de WordPress requeridas" }, { status: 400 });
    }
    if (!keyword || !type) {
      return NextResponse.json({ error: "keyword y type son requeridos" }, { status: 400 });
    }

    const client = clientName || "la empresa";

    // Step 1: metadata (fast, small JSON)
    const meta = await generateMeta({ type, keyword, audience, objective, tone, wordCount, clientName: client });

    // Step 2: HTML content (large, no JSON wrapping issues)
    const htmlContent = await generateHtmlContent({
      type, keyword, audience, objective, tone, wordCount,
      clientName: client,
      title: meta.title,
      faq: meta.faq || [],
    });

    // Step 3: Content is clean HTML only — schema goes via RankMath meta fields and custom field
    const fullContent = htmlContent;

    const schemaType = type === "product" ? "Product" : type === "article" ? "Article" : "WebPage";
    const wpType = destination?.wpType || inferWpType(type);
    const isNew = !destination || destination === "new";

    // Build schema data and store as custom meta field (output via wp_head snippet)
    const schemaData = buildSchemaData(type, meta, keyword, client);
    const schemaJson = schemaData.map((s) => JSON.stringify(s)).join("||");

    const rankMathMeta: Record<string, string> = {
      rank_math_title: meta.metaTitle || "",
      rank_math_description: meta.metaDescription || "",
      rank_math_focus_keyword: meta.focusKeyword || keyword,
      rank_math_rich_snippet: schemaType,
      ...(type === "article" ? { rank_math_snippet_article_type: "BlogPosting" } : {}),
      _custom_json_ld: schemaJson,
    };

    let postId: number;
    let postLink = "";

    if (wpType === "products") {
      if (isNew) {
        const created = await callWordPressProxy({
          wpUrl, wpUsername, wpAppPassword,
          apiNamespace: "wc/v3",
          endpoint: "products",
          method: "POST",
          body: {
            name: meta.title,
            description: fullContent,
            short_description: meta.shortDescription || "",
            status: "publish",
            slug: meta.slug || undefined,
          },
        });
        postId = created.id;
        postLink = created.permalink || "";
        try {
          await callWordPressProxy({
            wpUrl, wpUsername, wpAppPassword,
            apiNamespace: "wp/v2",
            endpoint: `product/${postId}`,
            method: "POST",
            body: { meta: rankMathMeta },
          });
        } catch { /* RankMath snippet may not be installed */ }
      } else {
        const id = destination.id;
        await callWordPressProxy({
          wpUrl, wpUsername, wpAppPassword,
          apiNamespace: "wc/v3",
          endpoint: `products/${id}`,
          method: "POST",
          body: { description: fullContent, short_description: meta.shortDescription || "" },
        });
        postId = id;
        try {
          await callWordPressProxy({
            wpUrl, wpUsername, wpAppPassword,
            apiNamespace: "wp/v2",
            endpoint: `product/${id}`,
            method: "POST",
            body: { meta: rankMathMeta },
          });
        } catch { /* RankMath snippet may not be installed */ }
      }
    } else {
      const wpBody: Record<string, unknown> = {
        title: meta.title,
        status: "publish",
        content: fullContent,
        excerpt: meta.excerpt || meta.shortDescription || "",
        slug: meta.slug || undefined,
        meta: rankMathMeta,
      };

      if (isNew) {
        const created = await callWordPressProxy({
          wpUrl, wpUsername, wpAppPassword,
          apiNamespace: "wp/v2",
          endpoint: wpType,
          method: "POST",
          body: wpBody,
        });
        postId = created.id;
        postLink = created.link || "";
      } else {
        const id = destination.id;
        await callWordPressProxy({
          wpUrl, wpUsername, wpAppPassword,
          apiNamespace: "wp/v2",
          endpoint: `${wpType}/${id}`,
          method: "POST",
          body: wpBody,
        });
        postId = id;
      }
    }

    return NextResponse.json({
      success: true,
      postId,
      postLink,
      title: meta.title,
      metaTitle: meta.metaTitle,
      metaDescription: meta.metaDescription,
      focusKeyword: meta.focusKeyword || keyword,
      schema: schemaType,
      faqCount: (meta.faq as unknown[])?.length || 0,
      status: "publish",
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
