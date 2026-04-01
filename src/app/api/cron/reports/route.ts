import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const CRON_SECRET = process.env.CRON_SECRET || "CRON_SECRET_KEY_2026";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function calcNextSend(frequency: string, dayOfWeek?: number | null, dayOfMonth?: number | null): Date {
  const now = new Date();
  const next = new Date(now);

  if (frequency === "weekly" && dayOfWeek != null) {
    const currentDay = now.getDay();
    const daysUntil = (dayOfWeek - currentDay + 7) % 7 || 7;
    next.setDate(now.getDate() + daysUntil);
    next.setHours(8, 0, 0, 0);
  } else if (frequency === "monthly" && dayOfMonth != null) {
    next.setDate(dayOfMonth);
    next.setHours(8, 0, 0, 0);
    if (next <= now) {
      next.setMonth(next.getMonth() + 1);
    }
  }

  return next;
}

async function fetchPlatformMetrics(clientId: string, platform: string, from: string, to: string) {
  const res = await fetch(
    `${BASE_URL}/api/analytics/${platform}/metrics?clientId=${clientId}&from=${from}&to=${to}`
  );
  if (!res.ok) return null;
  return res.json();
}

function buildReportHtml(report: {
  name: string;
  dateFrom: Date;
  dateTo: Date;
  platforms: string[];
  reportData: unknown;
  clientName: string;
}): string {
  const data = report.reportData as Record<string, unknown>;

  const platformLabel: Record<string, string> = {
    facebook: "Facebook",
    instagram: "Instagram",
    youtube: "YouTube",
    tiktok: "TikTok",
    linkedin: "LinkedIn",
    google_ads: "Google Ads",
  };

  const platformSections = report.platforms
    .map((platform) => {
      const pData = data[platform] as Record<string, unknown> | null;
      const results = (pData?.results as Array<Record<string, unknown>>) || [];
      const first = results[0] || {};
      const summary = first.summary as Record<string, number> | undefined;

      const summaryRows = summary
        ? Object.entries(summary)
            .map(
              ([k, v]) =>
                `<tr><td style="padding:6px 12px;color:#555;">${k}</td><td style="padding:6px 12px;font-weight:600;">${v}</td></tr>`
            )
            .join("")
        : "<tr><td colspan='2' style='padding:6px 12px;color:#999;'>Sin datos disponibles</td></tr>";

      return `
        <div style="margin-bottom:24px;">
          <h3 style="margin:0 0 12px;font-size:16px;color:#111;">${platformLabel[platform] || platform}</h3>
          <table style="width:100%;border-collapse:collapse;background:#f9f9f9;border-radius:8px;overflow:hidden;">
            <tbody>${summaryRows}</tbody>
          </table>
        </div>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><title>${report.name}</title></head>
    <body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <div style="background:#FFC207;padding:24px 32px;">
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#000;">${report.name}</h1>
          <p style="margin:4px 0 0;color:#000;opacity:0.7;font-size:13px;">
            ${report.clientName} · ${report.dateFrom.toLocaleDateString("es-CL")} – ${report.dateTo.toLocaleDateString("es-CL")}
          </p>
        </div>
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (key !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Find all active schedules that are due
  const dueSchedules = await prisma.reportSchedule.findMany({
    where: {
      isActive: true,
      nextSendAt: { lte: now },
    },
    include: {
      client: { select: { id: true, name: true, website: true, logoUrl: true } },
    },
  });

  if (dueSchedules.length === 0) {
    return NextResponse.json({ message: "No hay informes pendientes", processed: 0 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY no configurada" }, { status: 500 });
  }
  const resend = new Resend(process.env.RESEND_API_KEY);

  const results: Array<{ scheduleId: string; name: string; status: string; error?: string }> = [];

  for (const schedule of dueSchedules) {
    try {
      // Calculate date range: last 30 days for weekly, last month for monthly
      const dateTo = new Date();
      const dateFrom = new Date();
      if (schedule.frequency === "weekly") {
        dateFrom.setDate(dateFrom.getDate() - 7);
      } else {
        dateFrom.setMonth(dateFrom.getMonth() - 1);
      }

      const fromStr = dateFrom.toISOString().split("T")[0];
      const toStr = dateTo.toISOString().split("T")[0];

      // Gather metrics for all platforms
      const reportData: Record<string, unknown> = {
        client: schedule.client,
        generatedAt: new Date().toISOString(),
      };

      for (const platform of schedule.platforms) {
        const metrics = await fetchPlatformMetrics(schedule.clientId, platform, fromStr, toStr);
        reportData[platform] = metrics;
      }

      // Save the report in the database
      const report = await prisma.analyticsReport.create({
        data: {
          clientId: schedule.clientId,
          name: schedule.name,
          dateFrom,
          dateTo,
          platforms: schedule.platforms,
          reportData: reportData as Parameters<typeof prisma.analyticsReport.create>[0]["data"]["reportData"],
        },
      });

      // Build HTML and send email
      const html = buildReportHtml({
        name: schedule.name,
        dateFrom,
        dateTo,
        platforms: schedule.platforms,
        reportData,
        clientName: schedule.client.name,
      });

      const { error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "informes@marketpro.cl",
        to: schedule.recipients,
        subject: `📊 Informe: ${schedule.name} — ${schedule.client.name}`,
        html,
      });

      if (error) {
        results.push({ scheduleId: schedule.id, name: schedule.name, status: "error", error: error.message });
        continue;
      }

      // Update schedule: lastSentAt and next send time
      const nextSendAt = calcNextSend(schedule.frequency, schedule.dayOfWeek, schedule.dayOfMonth);
      await prisma.reportSchedule.update({
        where: { id: schedule.id },
        data: { lastSentAt: now, nextSendAt },
      });

      results.push({ scheduleId: schedule.id, name: schedule.name, status: "sent" });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      results.push({ scheduleId: schedule.id, name: schedule.name, status: "error", error: errorMessage });
    }
  }

  const sent = results.filter((r) => r.status === "sent").length;
  const errors = results.filter((r) => r.status === "error").length;

  return NextResponse.json({
    message: `Procesados ${dueSchedules.length} informes: ${sent} enviados, ${errors} errores`,
    processed: dueSchedules.length,
    sent,
    errors,
    details: results,
  });
}
