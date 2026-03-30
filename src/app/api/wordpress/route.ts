import { NextRequest, NextResponse } from "next/server";

// Generic WordPress REST API proxy — supports wp/v2 and wc/v3 namespaces
export async function POST(req: NextRequest) {
  try {
    const {
      wpUrl,
      wpUsername,
      wpAppPassword,
      endpoint,
      method = "GET",
      body,
      apiNamespace = "wp/v2",
    } = await req.json();

    if (!wpUrl || !wpUsername || !wpAppPassword) {
      return NextResponse.json({ error: "Credenciales de WordPress incompletas" }, { status: 400 });
    }

    const credentials = Buffer.from(`${wpUsername}:${wpAppPassword}`).toString("base64");
    const base = wpUrl.replace(/\/$/, "");
    const url = `${base}/wp-json/${apiNamespace}/${endpoint}`;

    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `WordPress error ${res.status}: ${errText}` }, { status: res.status });
    }

    const data = await res.json();
    const total = res.headers.get("X-WP-Total");
    const totalPages = res.headers.get("X-WP-TotalPages");
    // Forward pagination headers as _meta so callers can paginate
    if (total || totalPages) {
      return NextResponse.json({ _data: data, _total: parseInt(total || "0"), _totalPages: parseInt(totalPages || "0") });
    }
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
