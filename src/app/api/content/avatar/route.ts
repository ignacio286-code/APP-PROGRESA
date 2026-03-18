import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get("image") as File | null;
    const script = formData.get("script") as string;
    const voice = formData.get("voice") as string;

    if (!image || !script) {
      return NextResponse.json({ error: "Imagen y guion son requeridos" }, { status: 400 });
    }

    // D-ID API integration (https://www.d-id.com)
    // Requires DID_API_KEY environment variable
    const didApiKey = process.env.DID_API_KEY;

    if (!didApiKey) {
      return NextResponse.json({
        url: null,
        message: "Configura DID_API_KEY en el archivo .env para usar la generación de avatares. Visita https://www.d-id.com para obtener tu clave.",
      });
    }

    // Upload image to D-ID
    const uploadForm = new FormData();
    uploadForm.append("image", image);

    const uploadRes = await fetch("https://api.d-id.com/images", {
      method: "POST",
      headers: { Authorization: `Basic ${didApiKey}` },
      body: uploadForm,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      return NextResponse.json({ error: `D-ID upload error: ${err}` }, { status: 500 });
    }

    const { id: imageId } = await uploadRes.json();

    // Create talking head video
    const talkRes = await fetch("https://api.d-id.com/talks", {
      method: "POST",
      headers: {
        Authorization: `Basic ${didApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source_url: imageId,
        script: {
          type: "text",
          input: script,
          ssml: false,
          provider: { type: "microsoft", voice_id: voice },
        },
        config: { fluent: true, pad_audio: 0.0 },
      }),
    });

    if (!talkRes.ok) {
      const err = await talkRes.text();
      return NextResponse.json({ error: `D-ID talk error: ${err}` }, { status: 500 });
    }

    const { id: talkId } = await talkRes.json();

    // Poll for completion
    let resultUrl: string | null = null;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 4000));
      const pollRes = await fetch(`https://api.d-id.com/talks/${talkId}`, {
        headers: { Authorization: `Basic ${didApiKey}` },
      });
      const pollData = await pollRes.json();
      if (pollData.status === "done") {
        resultUrl = pollData.result_url;
        break;
      }
      if (pollData.status === "error") {
        return NextResponse.json({ error: pollData.error?.message || "D-ID error" }, { status: 500 });
      }
    }

    return NextResponse.json({ url: resultUrl, talkId });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
