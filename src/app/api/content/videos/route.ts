import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Remotion server-side rendering would be done here.
    // For production: use @remotion/renderer with a Lambda or local render server.
    // This returns a mock URL for development purposes.

    return NextResponse.json({
      url: null,
      message: "Para renderizar videos con Remotion, configura un servidor de render con @remotion/renderer o usa Remotion Lambda.",
      config: body,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
