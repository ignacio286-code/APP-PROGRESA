import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  if (!clientId) return NextResponse.json(null);
  const config = await prisma.reportConfig.findUnique({ where: { clientId } });
  return NextResponse.json(config);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const config = await prisma.reportConfig.upsert({
    where: { clientId: body.clientId },
    update: { email: body.email, dayOfMonth: body.dayOfMonth, emailText: body.emailText, platforms: body.platforms, isActive: body.isActive ?? true },
    create: { clientId: body.clientId, email: body.email, dayOfMonth: body.dayOfMonth, emailText: body.emailText, platforms: body.platforms ?? "facebook,instagram", isActive: body.isActive ?? true },
  });
  return NextResponse.json(config);
}

export async function PUT(req: NextRequest) {
  // Manual send report trigger
  const body = await req.json();
  const { clientId, clientName, platforms } = body;

  if (!resend) {
    return NextResponse.json({ error: "RESEND_API_KEY no configurado" }, { status: 400 });
  }

  const config = await prisma.reportConfig.findUnique({ where: { clientId } });
  if (!config) return NextResponse.json({ error: "Configuración no encontrada" }, { status: 404 });

  const platformList = (platforms || config.platforms).split(",").map((p: string) => p.trim());
  const date = new Date().toLocaleDateString("es-CL", { month: "long", year: "numeric" });

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
  <div class="header"><h1>📊 Informe Mensual de Redes Sociales</h1><p style="margin:4px 0 0;color:#555;">${clientName} — ${date}</p></div>
  <div class="section">
    <p>${config.emailText || "Estimado cliente, adjuntamos el informe mensual de rendimiento de sus redes sociales."}</p>
  </div>
  <div class="section">
    <h3 style="margin-top:0">Plataformas analizadas:</h3>
    ${platformList.map((p: string) => `<span class="platform">${p.charAt(0).toUpperCase() + p.slice(1)}</span>`).join("")}
    <p style="color:#777;font-size:13px;margin-top:12px">Para ver el informe completo con estadísticas detalladas, acceda a su panel en <strong>app.progresa-group.cl</strong></p>
  </div>
  <div class="footer">Informe generado automáticamente por Progresa Group • ${new Date().toLocaleDateString("es-CL")}</div>
</body>
</html>`;

  await resend.emails.send({
    from: "Progresa Group <noreply@progresa-group.cl>",
    to: config.email,
    subject: `Informe Mensual Redes Sociales — ${clientName} — ${date}`,
    html: emailHtml,
  });

  await prisma.reportConfig.update({ where: { clientId }, data: { lastSentAt: new Date() } });

  return NextResponse.json({ ok: true });
}
