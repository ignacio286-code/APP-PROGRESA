import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt, style, size, apiKey } = await req.json();

    if (!prompt) return NextResponse.json({ error: "Prompt requerido" }, { status: 400 });

    const fullPrompt = `${prompt}, ${style} style, high quality, professional advertising`;

    if (!apiKey) {
      // Return a placeholder URL when no API key is configured
      const [width, height] = size.split("x");
      return NextResponse.json({
        url: `https://placehold.co/${width}x${height}/FFC207/000000?text=${encodeURIComponent(prompt.substring(0, 30))}`,
        message: "Demo: configura tu Nanobana API Key para generar imágenes reales",
      });
    }

    // Nanobana API call (adjust endpoint based on actual Nanobana API docs)
    const [width, height] = size.split("x");
    const res = await fetch("https://api.nanobana.ai/v1/images/generate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        width: parseInt(width),
        height: parseInt(height),
        n: 1,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `Nanobana error: ${err}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
