import { NextRequest, NextResponse } from "next/server";

interface ReportItem {
  title: string;
  type: string;
  focusKeyword: string;
  seoTitle: string;
  score: number | null;
}

export async function POST(req: NextRequest) {
  try {
    const { recipientEmail, clientName, reportDate, wpUrl, summary, stats, items } = await req.json() as {
      recipientEmail: string;
      clientName: string;
      reportDate: string;
      wpUrl: string;
      summary: string;
      stats: { total: number; optimized: number; pending: number; pages: number; products: number };
      items: ReportItem[];
    };

    if (!recipientEmail || !clientName) {
      return NextResponse.json({ error: "recipientEmail y clientName son requeridos" }, { status: 400 });
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return NextResponse.json({ error: "RESEND_API_KEY no configurado en las variables de entorno" }, { status: 500 });
    }

    const scoreColor = (s: number | null) => {
      if (s === null) return "#9ca3af";
      if (s >= 80) return "#16a34a";
      if (s >= 50) return "#d97706";
      return "#dc2626";
    };

    const itemsHtml = (items || []).slice(0, 30).map(item => `
      <tr style="border-bottom:1px solid #f3f4f6;">
        <td style="padding:8px 12px;font-size:12px;color:#6b7280;">${item.type === "page" ? "Página" : "Producto"}</td>
        <td style="padding:8px 12px;font-size:13px;font-weight:500;color:#111827;">${item.title}</td>
        <td style="padding:8px 12px;font-size:12px;">
          ${item.focusKeyword
            ? `<span style="background:#eff6ff;color:#2563eb;padding:2px 8px;border-radius:999px;">${item.focusKeyword}</span>`
            : `<span style="color:#ef4444;font-size:11px;">Sin keyword</span>`}
        </td>
        <td style="padding:8px 12px;text-align:center;">
          <span style="background:${scoreColor(item.score)}20;color:${scoreColor(item.score)};padding:2px 10px;border-radius:4px;font-size:12px;font-weight:700;">
            ${item.score !== null ? item.score : "N/A"}
          </span>
        </td>
      </tr>
    `).join("");

    const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Informe SEO — ${clientName}</title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:700px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="background:#000;border-radius:16px 16px 0 0;padding:32px;margin-bottom:0;">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div>
          <p style="color:#FFC207;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Progresa Agencia</p>
          <h1 style="color:#fff;font-size:24px;font-weight:900;margin:0;">Informe SEO</h1>
          <p style="color:#9ca3af;font-size:14px;margin:4px 0 0;">${clientName} — ${reportDate}</p>
        </div>
        <div style="width:56px;height:56px;background:#FFC207;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900;color:#000;">
          ${clientName.charAt(0).toUpperCase()}
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div style="background:#fff;border:1px solid #e5e7eb;border-top:0;padding:24px;">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px;">
        <div style="background:#f9fafb;border-radius:12px;padding:16px;text-align:center;">
          <p style="font-size:28px;font-weight:900;color:#111827;margin:0;">${stats.total}</p>
          <p style="font-size:11px;color:#6b7280;margin:4px 0 0;">Total</p>
        </div>
        <div style="background:#f0fdf4;border-radius:12px;padding:16px;text-align:center;">
          <p style="font-size:28px;font-weight:900;color:#16a34a;margin:0;">${stats.optimized}</p>
          <p style="font-size:11px;color:#6b7280;margin:4px 0 0;">Optimizados</p>
        </div>
        <div style="background:#fef2f2;border-radius:12px;padding:16px;text-align:center;">
          <p style="font-size:28px;font-weight:900;color:#dc2626;margin:0;">${stats.pending}</p>
          <p style="font-size:11px;color:#6b7280;margin:4px 0 0;">Pendientes</p>
        </div>
        <div style="background:#eff6ff;border-radius:12px;padding:16px;text-align:center;">
          <p style="font-size:16px;font-weight:900;color:#2563eb;margin:0;">${stats.pages}p/${stats.products}pr</p>
          <p style="font-size:11px;color:#6b7280;margin:4px 0 0;">Págs/Prods</p>
        </div>
      </div>

      ${summary ? `
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;margin-bottom:24px;">
        <p style="font-size:11px;font-weight:700;color:#2563eb;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Resumen ejecutivo</p>
        <p style="font-size:14px;color:#1e40af;margin:0;line-height:1.6;">${summary}</p>
      </div>
      ` : ""}

      <!-- Site info -->
      <p style="font-size:12px;color:#9ca3af;margin:0 0 20px;">Sitio web: <a href="${wpUrl}" style="color:#2563eb;">${wpUrl}</a></p>

      <!-- Table -->
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#f9fafb;border-bottom:2px solid #e5e7eb;">
            <th style="padding:10px 12px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Tipo</th>
            <th style="padding:10px 12px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Elemento</th>
            <th style="padding:10px 12px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Keyword</th>
            <th style="padding:10px 12px;text-align:center;font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Score</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      ${items.length > 30 ? `<p style="font-size:12px;color:#9ca3af;margin:16px 0 0;text-align:center;">... y ${items.length - 30} elementos más</p>` : ""}
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 16px 16px;padding:20px;text-align:center;">
      <p style="font-size:12px;color:#9ca3af;margin:0;">
        Informe generado por <strong style="color:#000;">Progresa Agencia</strong> ·
        <a href="${wpUrl}" style="color:#2563eb;">Ver sitio</a>
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Progresa Agencia <informes@progresa-group.cl>",
        to: [recipientEmail],
        subject: `Informe SEO — ${clientName} — ${reportDate}`,
        html,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      throw new Error(`Resend error: ${errText}`);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
