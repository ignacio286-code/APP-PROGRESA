import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

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

  const platformSections = report.platforms.map((platform) => {
    const pData = data[platform] as Record<string, unknown> | null;
    const results = (pData?.results as Array<Record<string, unknown>>) || [];
    const first = results[0] || {};
    const summary = first.summary as Record<string, number> | undefined;

    const summaryRows = summary
      ? Object.entries(summary)
          .map(([k, v]) => `<tr><td style="padding:6px 12px;color:#555;">${k}</td><td style="padding:6px 12px;font-weight:600;">${v}</td></tr>`)
          .join("")
      : "<tr><td colspan='2' style='padding:6px 12px;color:#999;'>Sin datos disponibles</td></tr>";

    const platformLabel: Record<string, string> = {
      facebook: "Facebook",
      instagram: "Instagram",
      youtube: "YouTube",
      tiktok: "TikTok",
      linkedin: "LinkedIn",
      google_ads: "Google Ads",
    };

    return `
      <div style="margin-bottom:24px;">
        <h3 style="margin:0 0 12px;font-size:16px;color:#111;">${platformLabel[platform] || platform}</h3>
        <table style="width:100%;border-collapse:collapse;background:#f9f9f9;border-radius:8px;overflow:hidden;">
          <tbody>${summaryRows}</tbody>
        </table>
      </div>
    `;
  }).join("");

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><title>${report.name}</title></head>
    <body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <div style="background:#FFC207;padding:24px 32px;">
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#000;">${report.name}</h1>
          <p style="margin:4px 0 0;color:#000;opacity:0.7;font-size:13px;">
            ${clientName} · ${report.dateFrom.toLocaleDateString("es-CL")} – ${report.dateTo.toLocaleDateString("es-CL")}
          </p>
        </div>
        <!-- Body -->
        <div style="padding:32px;">
          <p style="margin:0 0 24px;font-size:14px;color:#555;">
            Aquí tienes el resumen de analítica para el período indicado.
          </p>
          ${platformSections}
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
          <p style="margin:0;font-size:12px;color:#999;text-align:center;">
            Generado automáticamente por MarketPro · ${new Date().toLocaleDateString("es-CL")}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
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
    from: process.env.RESEND_FROM_EMAIL || "informes@marketpro.cl",
    to: recipients,
    subject: `📊 Informe: ${report.name} — ${report.client.name}`,
    html,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
