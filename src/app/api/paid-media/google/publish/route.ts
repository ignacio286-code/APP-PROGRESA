import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { plan, client } = await req.json();

    if (!client.googleClientId || !client.googleDeveloperToken) {
      return NextResponse.json({ error: "Credenciales de Google Ads incompletas" }, { status: 400 });
    }

    // Note: Google Ads API requires OAuth2 flow - here we demonstrate the structure
    // Real implementation needs google-ads-api npm package
    return NextResponse.json({
      campaignId: `GA_${Date.now()}`,
      name: plan.campaignName,
      status: "PAUSED",
      message: "Para publicar en Google Ads, se requiere completar el flujo OAuth2. El plan está listo para importar manualmente en Google Ads Manager.",
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
