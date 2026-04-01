import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const CRON_SECRET = process.env.CRON_SECRET || "CRON_SECRET_KEY_2026";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (key !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().getDate();

  // Find all active ReportConfig where dayOfMonth matches today
  const configs = await prisma.reportConfig.findMany({
    where: {
      isActive: true,
      dayOfMonth: today,
    },
    include: {
      client: { select: { id: true, name: true } },
    },
  });

  if (configs.length === 0) {
    return NextResponse.json({ message: "No hay informes de redes sociales para hoy", processed: 0 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY no configurada" }, { status: 500 });
  }
  const resend = new Resend(process.env.RESEND_API_KEY);

  const results: Array<{ configId: string; clientName: string; status: string; error?: string }> = [];

  for (const config of configs) {
    try {
      const platformList = config.platforms.split(",").map((p) => p.trim());
      const date = new Date().toLocaleDateString("es-CL", { month: "long", year: "numeric" });
      const clientName = config.client.name;

      const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; }
  .header { background: #FFC207; padding: 24px; text-align: center; }
  .header h1 { color: #000; font-size: 22px; margin: 0; }
  .section { padding: 20px; border-bottom: 1px solid #eee; }
  .platform { display: inline-block; background: #f5f5f5; border-radius: 6px; padding: 4px 12px; margin: 4px; font-size: 13px; }
  .footer { padding: 16px; text-align: center; color: #999; font-size: 12px; }
</style></head>
<body>
  <div class="header"><h1>Informe Mensual de Redes Sociales</h1><p style="margin:4px 0 0;color:#555;">${clientName} — ${date}</p></div>
  <div class="section">
    <p>${config.emailText || "Estimado cliente, adjuntamos el informe mensual de rendimiento de sus redes sociales."}</p>
  </div>
  <div class="section">
    <h3 style="margin-top:0">Plataformas analizadas:</h3>
    ${platformList.map((p) => `<span class="platform">${p.charAt(0).toUpperCase() + p.slice(1)}</span>`).join("")}
    <p style="color:#777;font-size:13px;margin-top:12px">Para ver el informe completo con estadísticas detalladas, acceda a su panel en <strong>app.progresa-group.cl</strong></p>
  </div>
  <div class="footer">Informe generado automaticamente por Progresa Group • ${new Date().toLocaleDateString("es-CL")}</div>
</body>
</html>`;

      const { error } = await resend.emails.send({
        from: "Progresa Group <noreply@progresa-group.cl>",
        to: config.email,
        subject: `Informe Mensual Redes Sociales — ${clientName} — ${date}`,
        html: emailHtml,
      });

      if (error) {
        results.push({ configId: config.id, clientName, status: "error", error: error.message });
        continue;
      }

      // Update lastSentAt
      await prisma.reportConfig.update({
        where: { clientId: config.clientId },
        data: { lastSentAt: new Date() },
      });

      results.push({ configId: config.id, clientName, status: "sent" });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      results.push({ configId: config.id, clientName: config.client.name, status: "error", error: errorMessage });
    }
  }

  const sent = results.filter((r) => r.status === "sent").length;
  const errors = results.filter((r) => r.status === "error").length;

  return NextResponse.json({
    message: `Procesados ${configs.length} informes sociales: ${sent} enviados, ${errors} errores`,
    processed: configs.length,
    sent,
    errors,
    details: results,
  });
}
