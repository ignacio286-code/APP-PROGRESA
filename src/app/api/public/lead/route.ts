import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, website, description, services } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Nombre y email son requeridos" },
        { status: 400 }
      );
    }

    const lead = await prisma.crmLead.create({
      data: {
        name,
        email,
        phone: phone || null,
        website: website || null,
        description: description || null,
        services: services || null,
        status: "Nuevo",
        contactDate: new Date(),
      },
    });

    // Send email notification
    try {
      await resend.emails.send({
        from: "Progresa Web <notificaciones@agenciaprogresa.cl>",
        to: "progresa.agency@gmail.com",
        subject: `Nuevo cliente potencial: ${name}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <div style="background:#000;padding:20px;border-radius:12px 12px 0 0;text-align:center;">
              <h1 style="color:#FFC207;margin:0;font-size:24px;">Nuevo Cliente Potencial</h1>
            </div>
            <div style="background:#f9fafb;padding:24px;border:1px solid #e5e7eb;border-radius:0 0 12px 12px;">
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;width:120px;">Nombre:</td><td style="padding:8px 0;font-weight:700;font-size:14px;">${name}</td></tr>
                <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Email:</td><td style="padding:8px 0;font-size:14px;"><a href="mailto:${email}" style="color:#FFC207;">${email}</a></td></tr>
                ${phone ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Telefono:</td><td style="padding:8px 0;font-size:14px;"><a href="tel:${phone}" style="color:#FFC207;">${phone}</a></td></tr>` : ""}
                ${website ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Sitio web:</td><td style="padding:8px 0;font-size:14px;">${website}</td></tr>` : ""}
                ${services ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Servicio:</td><td style="padding:8px 0;font-size:14px;font-weight:600;">${services}</td></tr>` : ""}
                ${description ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:14px;vertical-align:top;">Mensaje:</td><td style="padding:8px 0;font-size:14px;">${description}</td></tr>` : ""}
              </table>
              <div style="margin-top:20px;text-align:center;">
                <a href="https://app.agencia-de-marketing.cl/crm/leads" style="display:inline-block;padding:12px 24px;background:#FFC207;color:#000;font-weight:700;text-decoration:none;border-radius:8px;">Ver en el CRM</a>
              </div>
            </div>
            <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px;">Progresa Agencia de Marketing - agencia-de-marketing.cl</p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("Error enviando email:", emailErr);
    }

    return NextResponse.json({ success: true, id: lead.id }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Error al registrar" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
