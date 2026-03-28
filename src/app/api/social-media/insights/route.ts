import { NextRequest, NextResponse } from "next/server";

// Proxy to Facebook/Instagram Graph API
export async function POST(req: NextRequest) {
  try {
    const { accessToken, endpoint, params = {} } = await req.json();
    if (!accessToken || !endpoint) return NextResponse.json({ error: "accessToken y endpoint requeridos" }, { status: 400 });

    const qs = new URLSearchParams({ access_token: accessToken, ...params }).toString();
    const url = `https://graph.facebook.com/v19.0/${endpoint}?${qs}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.error) return NextResponse.json({ error: data.error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
