import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toLocaleString("es-CL");
}

function buildReportHtml(report: {
  name: string;
  dateFrom: Date;
  dateTo: Date;
  platforms: string[];
  reportData: unknown;
  client?: { name: string; logoUrl?: string | null };
}): string {
  const data = report.reportData as Record<string, unknown>;
  const clientName = report.client?.name || "Cliente";
  const clientLogo = report.client?.logoUrl;

  const platformColors: Record<string, string> = {
    facebook: "#1877F2",
    instagram: "#E4405F",
    youtube: "#FF0000",
    tiktok: "#000000",
    linkedin: "#0A66C2",
    google_ads: "#4285F4",
  };

  const platformIcons: Record<string, string> = {
    facebook: "f",
    instagram: "IG",
    youtube: "▶",
    tiktok: "♪",
    linkedin: "in",
    google_ads: "G",
  };

  const platformLabels: Record<string, string> = {
    facebook: "Facebook",
    instagram: "Instagram",
    youtube: "YouTube",
    tiktok: "TikTok",
    linkedin: "LinkedIn",
    google_ads: "Google Ads",
  };

  const platformSections = report.platforms.map((platform) => {
    const pData = data[platform] as Record<string, unknown> | null;
    const results = (pData?.results as Array<Record<string, unknown>>) || [];
    const first = results[0] || {};
    const summary = first.summary as Record<string, number> | undefined;
    const color = platformColors[platform] || "#FFC207";
    const icon = platformIcons[platform] || "●";
    const label = platformLabels[platform] || platform;

    const metricLabels: Record<string, string> = {
      fan_count: "Seguidores",
      followers_count: "Seguidores",
      follower_count: "Seguidores",
      page_impressions: "Impresiones",
      impressions: "Impresiones",
      impressionCount: "Impresiones",
      page_reach: "Alcance",
      reach: "Alcance",
      page_engaged_users: "Usuarios Activos",
      page_post_engagements: "Interacciones",
      accounts_engaged: "Cuentas Alcanzadas",
      profile_views: "Visitas al Perfil",
      media_count: "Publicaciones",
      subscriberCount: "Suscriptores",
      viewCount: "Vistas Totales",
      videoCount: "Videos",
      views: "Vistas",
      estimatedMinutesWatched: "Minutos Vistos",
      likes: "Me Gusta",
      comments: "Comentarios",
      clickCount: "Clicks",
      clicks: "Clicks",
      spend: "Inversión",
      ctr: "CTR",
      cpc: "CPC",
      conversions: "Conversiones",
      cost_micros: "Costo",
    };

    if (!summary || Object.keys(summary).length === 0) {
      return `
        <div style="margin-bottom:24px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
          <div style="background:${color};padding:14px 20px;display:flex;align-items:center;gap:10px;">
            <div style="width:32px;height:32px;background:rgba(255,255,255,0.2);border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:14px;">${icon}</div>
            <span style="color:#fff;font-weight:700;font-size:15px;">${label}</span>
          </div>
          <div style="padding:20px;text-align:center;color:#999;font-size:13px;">Sin datos disponibles para este período</div>
        </div>
      `;
    }

    const metricsHtml = Object.entries(summary)
      .filter(([, v]) => v !== 0 && v !== null && v !== undefined)
      .map(([k, v]) => {
        const displayLabel = metricLabels[k] || k.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
        const displayValue = typeof v === "number" ? formatNumber(v) : String(v);
        return `
          <div style="text-align:center;padding:12px;">
            <div style="font-size:24px;font-weight:900;color:${color};line-height:1;">${displayValue}</div>
            <div style="font-size:11px;color:#666;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;">${displayLabel}</div>
          </div>
        `;
      }).join("");

    return `
      <div style="margin-bottom:24px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        <div style="background:${color};padding:14px 20px;">
          <table style="width:100%;"><tr>
            <td style="vertical-align:middle;">
              <div style="display:inline-block;width:32px;height:32px;background:rgba(255,255,255,0.2);border-radius:8px;text-align:center;line-height:32px;color:#fff;font-weight:800;font-size:14px;">${icon}</div>
              <span style="color:#fff;font-weight:700;font-size:15px;margin-left:10px;">${label}</span>
            </td>
          </tr></table>
        </div>
        <div style="padding:16px;display:flex;flex-wrap:wrap;justify-content:center;gap:8px;">
          <table style="width:100%;"><tr>
            ${metricsHtml}
          </tr></table>
        </div>
      </div>
    `;
  }).join("");

  const dateFrom = report.dateFrom.toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
  const dateTo = report.dateTo.toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${report.name}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <div style="max-width:640px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background:#000;padding:32px 40px;">
      <table style="width:100%;">
        <tr>
          <td style="vertical-align:middle;">
            <img src="https://agencia-de-marketing.cl/logo-progresa-blanco.webp" alt="Progresa Agencia" width="140" style="display:block;">
          </td>
          <td style="vertical-align:middle;text-align:right;">
            ${clientLogo ? `<img src="${clientLogo}" alt="${clientName}" width="80" style="display:inline-block;border-radius:8px;background:#fff;padding:4px;">` : `<div style="display:inline-block;width:48px;height:48px;background:#FFC207;border-radius:12px;text-align:center;line-height:48px;font-weight:900;font-size:20px;color:#000;">${clientName.charAt(0).toUpperCase()}</div>`}
          </td>
        </tr>
      </table>
    </div>

    <!-- Yellow accent -->
    <div style="height:4px;background:linear-gradient(90deg,#FFC207,#e6ae00);"></div>

    <!-- Title -->
    <div style="padding:28px 40px 0;">
      <h1 style="margin:0;font-size:22px;font-weight:900;color:#111;">${report.name}</h1>
      <p style="margin:6px 0 0;font-size:14px;color:#666;">
        <strong>${clientName}</strong> · ${dateFrom} – ${dateTo}
      </p>
    </div>

    <!-- Platforms -->
    <div style="padding:24px 40px 32px;">
      ${platformSections}
    </div>

    <!-- Footer -->
    <div style="background:#000;padding:24px 40px;text-align:center;">
      <img src="https://agencia-de-marketing.cl/logo-progresa-blanco.webp" alt="Progresa" width="100" style="display:block;margin:0 auto 10px;">
      <p style="color:rgba(255,255,255,0.7);font-size:12px;margin:0;">Informe generado por Progresa Agencia · <a href="https://agencia-de-marketing.cl" style="color:#FFC207;text-decoration:none;">agencia-de-marketing.cl</a></p>
      <p style="color:rgba(255,255,255,0.4);font-size:11px;margin:6px 0 0;">Avda Oriente 565, Los Ángeles · contacto@agenciaprogresa.cl · +56 9 9943 7664</p>
    </div>
  </div>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { reportId, recipients } = body;

  if (!reportId || !recipients?.length) {
    return NextResponse.json({ error: "reportId y recipients son requeridos" }, { status: 400 });
  }

  const report = await prisma.analyticsReport.findUnique({
    where: { id: reportId },
    include: { client: { select: { name: true, logoUrl: true } } },
  });

  if (!report) return NextResponse.json({ error: "Informe no encontrado" }, { status: 404 });

  const html = buildReportHtml(report);

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY no configurada" }, { status: 500 });
  }
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: "Progresa Informes <notificaciones@agenciaprogresa.cl>",
    to: recipients,
    cc: "progresa.agency@gmail.com",
    subject: `Informe: ${report.name} — ${report.client.name}`,
    html,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
