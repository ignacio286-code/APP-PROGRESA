import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { plan, client } = await req.json();

    if (!client.metaAccessToken || !client.metaAdAccountId) {
      return NextResponse.json({ error: "Credenciales de Meta incompletas" }, { status: 400 });
    }

    const adAccountId = client.metaAdAccountId.startsWith("act_")
      ? client.metaAdAccountId
      : `act_${client.metaAdAccountId}`;

    const baseUrl = `https://graph.facebook.com/v18.0`;
    const token = client.metaAccessToken;

    // 1. Create campaign
    const campaignRes = await fetch(`${baseUrl}/${adAccountId}/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: plan.campaignName,
        objective: plan.objective,
        status: "PAUSED", // Start paused for safety
        access_token: token,
      }),
    });

    const campaignData = await campaignRes.json();
    if (campaignData.error) {
      return NextResponse.json({ error: campaignData.error.message }, { status: 400 });
    }

    return NextResponse.json({
      campaignId: campaignData.id,
      status: "PAUSED",
      message: "Campaña creada exitosamente en estado PAUSADO. Revísala en Meta Ads Manager antes de activarla.",
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
