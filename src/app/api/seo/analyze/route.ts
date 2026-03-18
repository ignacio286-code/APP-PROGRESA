import { NextRequest, NextResponse } from "next/server";

interface SeoResult {
  url: string;
  title: string;
  metaDescription: string;
  h1: string[];
  h2: string[];
  images: { src: string; alt: string }[];
  wordCount: number;
  issues: string[];
  score: number;
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "URL requerida" }, { status: 400 });

    const res = await fetch(url, {
      headers: { "User-Agent": "MarketPro SEO Analyzer/1.0" },
    });
    const html = await res.text();

    // Extract SEO elements via regex (no DOM parser needed server-side)
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const h1Matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) =>
      m[1].replace(/<[^>]+>/g, "").trim()
    );
    const h2Matches = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map((m) =>
      m[1].replace(/<[^>]+>/g, "").trim()
    );
    const imgMatches = [...html.matchAll(/<img[^>]*src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)["'])?[^>]*/gi)].map((m) => ({
      src: m[1],
      alt: m[2] || "",
    }));
    const bodyText = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const wordCount = bodyText.split(" ").filter(Boolean).length;

    const title = titleMatch?.[1]?.replace(/<[^>]+>/g, "").trim() || "";
    const metaDescription = metaDescMatch?.[1] || "";

    const issues: string[] = [];
    if (!title) issues.push("Falta el título de la página");
    else if (title.length < 30) issues.push(`Título demasiado corto (${title.length} caracteres, mínimo 30)`);
    else if (title.length > 60) issues.push(`Título demasiado largo (${title.length} caracteres, máximo 60)`);

    if (!metaDescription) issues.push("Falta la meta descripción");
    else if (metaDescription.length < 120) issues.push(`Meta descripción corta (${metaDescription.length} chars, mínimo 120)`);
    else if (metaDescription.length > 160) issues.push(`Meta descripción larga (${metaDescription.length} chars, máximo 160)`);

    if (h1Matches.length === 0) issues.push("No hay etiqueta H1");
    else if (h1Matches.length > 1) issues.push(`Múltiples H1 (${h1Matches.length}) — debe haber solo uno`);

    const imgsWithoutAlt = imgMatches.filter((img) => !img.alt).length;
    if (imgsWithoutAlt > 0) issues.push(`${imgsWithoutAlt} imagen(es) sin atributo alt`);

    if (wordCount < 300) issues.push(`Contenido escaso (${wordCount} palabras, recomendado 300+)`);

    const maxScore = 6;
    const score = Math.round(((maxScore - issues.length) / maxScore) * 100);

    const result: SeoResult = {
      url,
      title,
      metaDescription,
      h1: h1Matches,
      h2: h2Matches.slice(0, 10),
      images: imgMatches.slice(0, 20),
      wordCount,
      issues,
      score: Math.max(0, score),
    };

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
