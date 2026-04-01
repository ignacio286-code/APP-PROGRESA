import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";

function getResend() { return new Resend(process.env.RESEND_API_KEY); }

function formatCLP(n: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
}

function buildProposalHtml(proposal: {
  folio?: string | null;
  name: string;
  clientEmail?: string | null;
  clientRut?: string | null;
  clientAddress?: string | null;
  clientPhone?: string | null;
  issueDate: Date;
  dueDate?: Date | null;
  termsConditions?: string | null;
  notes?: string | null;
  agentName?: string | null;
  agentPhone?: string | null;
  agentEmail?: string | null;
  items: Array<{
    name: string;
    description?: string | null;
    quantity: number;
    unitPrice: number;
    discount: number;
    tax: number;
  }>;
}, acceptUrl: string) {
  const subtotal = proposal.items.reduce((s, i) => {
    const base = i.quantity * i.unitPrice;
    const disc = base * (i.discount / 100);
    return s + base - disc;
  }, 0);
  const tax = proposal.items.reduce((s, i) => {
    const base = i.quantity * i.unitPrice;
    const disc = base * (i.discount / 100);
    return s + (base - disc) * (i.tax / 100);
  }, 0);
  const total = subtotal + tax;

  const itemsHtml = proposal.items.map(item => {
    const base = item.quantity * item.unitPrice;
    const disc = base * (item.discount / 100);
    const itemTax = (base - disc) * (item.tax / 100);
    const itemTotal = base - disc + itemTax;
    return `
      <tr>
        <td style="padding:14px 16px;border-bottom:1px solid #f0f0f0;">
          <strong style="font-size:14px;color:#111;">${item.name}</strong>
          ${item.description ? `<br><span style="color:#444;font-size:13px;line-height:1.6;">${item.description}</span>` : ''}
        </td>
        <td style="padding:14px 12px;border-bottom:1px solid #f0f0f0;text-align:center;font-size:14px;">${item.quantity}</td>
        <td style="padding:14px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:14px;">${formatCLP(item.unitPrice)}</td>
        <td style="padding:14px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:14px;">${formatCLP(itemTax)}</td>
        <td style="padding:14px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:14px;font-weight:700;">${formatCLP(itemTotal)}</td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#f5f5f5;">
  <div style="max-width:700px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1);">

    <!-- Header with logo -->
    <div style="background:#000;padding:32px 40px;">
      <table style="width:100%;">
        <tr>
          <td style="vertical-align:top;">
            <div style="margin-bottom:8px;">
              <img src="https://agencia-de-marketing.cl/logo-progresa-blanco.webp" alt="Progresa Agencia" width="160" style="display:block;margin-bottom:8px;">
            </div>
            <p style="color:rgba(255,255,255,0.85);font-size:12px;margin:0;line-height:1.6;">
              PROGRESA GROUP SpA · 77.910.002-2<br>
              Avda Oriente 565, Los Ángeles<br>
              Región del Bío Bío, Chile<br>
              +56 9 9943 7664 · <a href="mailto:contacto@agenciaprogresa.cl" style="color:#FFC207;text-decoration:none;">contacto@agenciaprogresa.cl</a>
            </p>
          </td>
          <td style="text-align:right;vertical-align:top;">
            <div style="background:rgba(255,194,7,0.15);border:1px solid rgba(255,194,7,0.3);border-radius:12px;padding:16px 20px;display:inline-block;">
              <p style="color:#FFC207;font-size:11px;margin:0;font-weight:700;text-transform:uppercase;letter-spacing:2px;">Propuesta Comercial</p>
              <p style="color:#fff;font-size:28px;font-weight:900;margin:6px 0 0;letter-spacing:-1px;">#${proposal.folio || 'S/N'}</p>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Yellow accent line -->
    <div style="height:4px;background:linear-gradient(90deg,#FFC207,#e6ae00);"></div>

    <!-- Body -->
    <div style="padding:40px;">

      <!-- Client & dates info -->
      <table style="width:100%;margin-bottom:32px;">
        <tr>
          <td style="vertical-align:top;width:55%;padding-right:20px;">
            <div style="background:#f8f9fa;border-radius:12px;padding:20px;border-left:4px solid #FFC207;">
              <p style="font-size:11px;color:#FFC207;text-transform:uppercase;letter-spacing:2px;margin:0 0 10px;font-weight:700;">EMPRESA</p>
              <p style="font-size:18px;font-weight:800;color:#111;margin:0 0 6px;">${proposal.name}</p>
              ${proposal.clientRut ? `<p style="font-size:13px;color:#333;margin:0 0 3px;">RUT: <strong>${proposal.clientRut}</strong></p>` : ''}
              ${proposal.clientAddress ? `<p style="font-size:13px;color:#333;margin:0 0 3px;">Dirección: ${proposal.clientAddress}</p>` : ''}
              ${proposal.clientPhone ? `<p style="font-size:13px;color:#333;margin:0 0 3px;">Teléfono: <strong>${proposal.clientPhone}</strong></p>` : ''}
              ${proposal.clientEmail ? `<p style="font-size:13px;color:#333;margin:0;">Email: <strong>${proposal.clientEmail}</strong></p>` : ''}
            </div>
          </td>
          <td style="vertical-align:top;">
            <div style="background:#f8f9fa;border-radius:12px;padding:20px;">
              <p style="font-size:13px;color:#333;margin:0 0 8px;">Fecha de Emisión: <strong>${new Date(proposal.issueDate).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></p>
              ${proposal.dueDate ? `<p style="font-size:13px;color:#333;margin:0 0 8px;">Fecha de Vencimiento: <strong>${new Date(proposal.dueDate).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></p>` : ''}
              ${proposal.agentName ? `
              <div style="border-top:1px solid #e5e7eb;padding-top:10px;margin-top:10px;">
                <p style="font-size:13px;color:#333;margin:0 0 3px;">Ejecutivo: <strong>${proposal.agentName}</strong></p>
                ${proposal.agentPhone ? `<p style="font-size:13px;color:#333;margin:0 0 3px;">Tel: ${proposal.agentPhone}</p>` : ''}
                ${proposal.agentEmail ? `<p style="font-size:13px;color:#333;margin:0;">Email: ${proposal.agentEmail}</p>` : ''}
              </div>` : ''}
            </div>
          </td>
        </tr>
      </table>

      <!-- Items table -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;border-radius:12px;overflow:hidden;">
        <thead>
          <tr style="background:#000;">
            <th style="padding:14px 16px;text-align:left;font-size:12px;color:#FFC207;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Producto</th>
            <th style="padding:14px 12px;text-align:center;font-size:12px;color:#FFC207;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Cantidad</th>
            <th style="padding:14px 12px;text-align:right;font-size:12px;color:#FFC207;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Valor Neto</th>
            <th style="padding:14px 12px;text-align:right;font-size:12px;color:#FFC207;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Impuesto</th>
            <th style="padding:14px 12px;text-align:right;font-size:12px;color:#FFC207;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Valor Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <!-- Totals -->
      <div style="text-align:right;margin-bottom:32px;">
        <table style="margin-left:auto;border-collapse:collapse;">
          <tr><td style="padding:6px 20px;font-size:14px;color:#333;">Valor Neto</td><td style="padding:6px 0;font-size:14px;font-weight:600;text-align:right;">${formatCLP(subtotal)}</td></tr>
          <tr><td style="padding:6px 20px;font-size:14px;color:#333;">Descuento Total</td><td style="padding:6px 0;font-size:14px;font-weight:600;text-align:right;">${formatCLP(0)}</td></tr>
          ${tax > 0 ? `<tr><td style="padding:6px 20px;font-size:14px;color:#333;">Impuesto</td><td style="padding:6px 0;font-size:14px;font-weight:600;text-align:right;">${formatCLP(tax)}</td></tr>` : ''}
          <tr style="border-top:3px solid #FFC207;">
            <td style="padding:12px 20px;font-size:18px;font-weight:900;color:#000;">Total</td>
            <td style="padding:12px 0;font-size:18px;font-weight:900;color:#000;text-align:right;">${formatCLP(total)}</td>
          </tr>
        </table>
      </div>

      <!-- Accept CTA -->
      <div style="text-align:center;margin:36px 0;background:linear-gradient(135deg,#000 0%,#1a1a2e 100%);border-radius:16px;padding:32px;">
        <p style="font-size:16px;color:rgba(255,255,255,0.8);margin:0 0 20px;">Para aceptar esta propuesta, haz click en el botón:</p>
        <a href="${acceptUrl}" style="display:inline-block;background:#FFC207;color:#000;font-weight:800;font-size:17px;padding:16px 48px;border-radius:50px;text-decoration:none;letter-spacing:0.5px;">
          ✓ Aceptar Propuesta
        </a>
      </div>

      <!-- Bank Transfer -->
      <div style="background:#000;border-radius:12px;padding:24px;margin-top:28px;">
        <p style="font-size:13px;color:#FFC207;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;font-weight:800;">Datos de Transferencia</p>
        <table style="width:100%;"><tr><td style="padding:4px 0;font-size:13px;color:rgba(255,255,255,0.7);width:140px;">Razón Social:</td><td style="padding:4px 0;font-size:13px;color:#fff;font-weight:600;">PROGRESA GROUP SpA</td></tr><tr><td style="padding:4px 0;font-size:13px;color:rgba(255,255,255,0.7);">RUT:</td><td style="padding:4px 0;font-size:13px;color:#fff;font-weight:600;">77.910.002-2</td></tr><tr><td style="padding:4px 0;font-size:13px;color:rgba(255,255,255,0.7);">Banco:</td><td style="padding:4px 0;font-size:13px;color:#fff;font-weight:600;">Banco Estado</td></tr><tr><td style="padding:4px 0;font-size:13px;color:rgba(255,255,255,0.7);">Tipo Cuenta:</td><td style="padding:4px 0;font-size:13px;color:#fff;font-weight:600;">Cuenta Corriente</td></tr><tr><td style="padding:4px 0;font-size:13px;color:rgba(255,255,255,0.7);">Email:</td><td style="padding:4px 0;font-size:13px;color:#FFC207;font-weight:600;">contacto@agenciaprogresa.cl</td></tr></table>
      </div>

      ${proposal.termsConditions ? `
      <!-- Terms -->
      <div style="background:#f8f9fa;border-radius:12px;padding:24px;margin-top:24px;border-top:3px solid #FFC207;">
        <p style="font-size:13px;color:#000;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;font-weight:800;">Términos y Condiciones</p>
        <p style="font-size:13px;color:#333;margin:0;line-height:1.8;">${proposal.termsConditions.replace(/\n/g, '<br>')}</p>
      </div>` : ''}

    </div>

    <!-- Footer -->
    <div style="background:#000;padding:24px 40px;text-align:center;"><img src="https://agencia-de-marketing.cl/logo-progresa-blanco.webp" alt="Progresa" width="120" style="display:block;margin:0 auto 12px;">
      <p style="color:rgba(255,255,255,0.8);font-size:12px;margin:0;">Progresa Agencia · Avda Oriente 565, Los Ángeles · contacto@agenciaprogresa.cl</p>
      <p style="color:rgba(255,255,255,0.5);font-size:11px;margin:6px 0 0;">METODOLOGÍA PROGRESA: 1. ESCUCHAR - ANALIZAR / 2. PLANIFICAR - EJECUTAR / 3. MEDIR Y PROGRESAR.</p>
    </div>
  </div>
</body>
</html>`;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { email } = await req.json().catch(() => ({}));

  const proposal = await prisma.crmProposal.findUnique({
    where: { id },
    include: { items: { orderBy: { order: "asc" } } },
  });

  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const toEmail = email || proposal.clientEmail;
  if (!toEmail) return NextResponse.json({ error: "No hay email de destino" }, { status: 400 });

  // Generate accept token if not exists
  const acceptToken = proposal.acceptToken || crypto.randomBytes(32).toString("hex");
  const appUrl = process.env.NEXTAUTH_URL || "https://app.agencia-de-marketing.cl";
  const acceptUrl = `${appUrl}/propuesta/${acceptToken}`;

  // Update token and sentAt
  await prisma.crmProposal.update({
    where: { id },
    data: { sentAt: new Date(), acceptToken, status: "Enviado" },
  });

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: true, warning: "Email no enviado: RESEND_API_KEY no configurada", acceptUrl });
  }

  const html = buildProposalHtml(proposal, acceptUrl);
  const resend = getResend();

  const { error } = await resend.emails.send({
    from: `Progresa Agencia <notificaciones@agenciaprogresa.cl>`,
    to: toEmail,
    cc: "contacto@agenciaprogresa.cl",
    subject: `Propuesta Comercial #${proposal.folio} — ${proposal.name}`,
    html,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, sentTo: toEmail, acceptUrl });
}
