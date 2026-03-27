import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

function formatCLP(n: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n);
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
    const itemTotal = base - disc;
    return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;">
          <strong>${item.name}</strong>
          ${item.description ? `<br><span style="color:#666;font-size:12px;">${item.description.substring(0, 100)}${item.description.length > 100 ? '...' : ''}</span>` : ''}
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:right;">${formatCLP(item.unitPrice)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:right;">${item.discount > 0 ? `-${item.discount}%` : '-'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;">${formatCLP(itemTotal)}</td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#f5f5f5;">
  <div style="max-width:680px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:#000;padding:28px 32px;display:flex;align-items:center;justify-content:space-between;">
      <div>
        <span style="font-size:28px;font-weight:900;color:#fff;letter-spacing:-1px;">Progresa</span>
        <span style="font-size:16px;font-style:italic;font-weight:600;color:#FFC207;margin-left:6px;">Agencia</span>
      </div>
      <div style="text-align:right;">
        <p style="color:#FFC207;font-size:12px;margin:0;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Propuesta Comercial</p>
        <p style="color:#fff;font-size:20px;font-weight:700;margin:4px 0 0;">#${proposal.folio || 'S/N'}</p>
      </div>
    </div>

    <!-- Body -->
    <div style="padding:32px;">

      <!-- Client info -->
      <div style="display:flex;gap:24px;margin-bottom:28px;">
        <div style="flex:1;background:#f9f9f9;border-radius:8px;padding:16px;">
          <p style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Para</p>
          <p style="font-size:16px;font-weight:700;color:#111;margin:0 0 4px;">${proposal.name}</p>
          ${proposal.clientRut ? `<p style="font-size:13px;color:#555;margin:0 0 2px;">RUT: ${proposal.clientRut}</p>` : ''}
          ${proposal.clientAddress ? `<p style="font-size:13px;color:#555;margin:0 0 2px;">${proposal.clientAddress}</p>` : ''}
          ${proposal.clientPhone ? `<p style="font-size:13px;color:#555;margin:0;">Tel: ${proposal.clientPhone}</p>` : ''}
        </div>
        <div style="text-align:right;min-width:160px;">
          <p style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Fechas</p>
          <p style="font-size:13px;color:#555;margin:0 0 4px;">Emisión: <strong>${new Date(proposal.issueDate).toLocaleDateString('es-CL')}</strong></p>
          ${proposal.dueDate ? `<p style="font-size:13px;color:#555;margin:0;">Vence: <strong>${new Date(proposal.dueDate).toLocaleDateString('es-CL')}</strong></p>` : ''}
        </div>
      </div>

      <!-- Items table -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <thead>
          <tr style="background:#f0f0f0;">
            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#666;font-weight:600;text-transform:uppercase;">Servicio</th>
            <th style="padding:10px 12px;text-align:center;font-size:12px;color:#666;font-weight:600;text-transform:uppercase;">Cant.</th>
            <th style="padding:10px 12px;text-align:right;font-size:12px;color:#666;font-weight:600;text-transform:uppercase;">Precio</th>
            <th style="padding:10px 12px;text-align:right;font-size:12px;color:#666;font-weight:600;text-transform:uppercase;">Desc.</th>
            <th style="padding:10px 12px;text-align:right;font-size:12px;color:#666;font-weight:600;text-transform:uppercase;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <!-- Totals -->
      <div style="text-align:right;border-top:2px solid #f0f0f0;padding-top:16px;margin-bottom:28px;">
        <p style="font-size:14px;color:#555;margin:0 0 4px;">Subtotal: <strong>${formatCLP(subtotal)}</strong></p>
        ${tax > 0 ? `<p style="font-size:14px;color:#555;margin:0 0 8px;">IVA: <strong>${formatCLP(tax)}</strong></p>` : ''}
        <p style="font-size:20px;font-weight:900;color:#111;margin:0;">Total: <span style="color:#FFC207;">${formatCLP(total)}</span></p>
      </div>

      ${proposal.termsConditions ? `
      <!-- Terms -->
      <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Términos y Condiciones</p>
        <p style="font-size:13px;color:#555;margin:0;line-height:1.6;">${proposal.termsConditions.replace(/\n/g, '<br>')}</p>
      </div>` : ''}

      <!-- Accept CTA -->
      <div style="text-align:center;margin:28px 0;">
        <p style="font-size:14px;color:#555;margin:0 0 16px;">Para aceptar esta propuesta, haz click en el botón:</p>
        <a href="${acceptUrl}" style="display:inline-block;background:#FFC207;color:#000;font-weight:700;font-size:16px;padding:14px 40px;border-radius:8px;text-decoration:none;letter-spacing:0.3px;">
          ✓ Aceptar Propuesta
        </a>
        <p style="font-size:11px;color:#aaa;margin:16px 0 0;">O copia este enlace en tu navegador:<br>${acceptUrl}</p>
      </div>

      ${proposal.agentName ? `
      <!-- Agent -->
      <div style="border-top:1px solid #f0f0f0;padding-top:16px;text-align:center;">
        <p style="font-size:13px;color:#555;margin:0;">Ejecutivo: <strong>${proposal.agentName}</strong>${proposal.agentPhone ? ` · ${proposal.agentPhone}` : ''}${proposal.agentEmail ? ` · ${proposal.agentEmail}` : ''}</p>
      </div>` : ''}
    </div>

    <!-- Footer -->
    <div style="background:#000;padding:16px 32px;text-align:center;">
      <p style="color:#666;font-size:12px;margin:0;">Progresa Agencia · progresa-group.cl</p>
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
  const appUrl = process.env.NEXTAUTH_URL || "https://app.progresa-group.cl";
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
  const fromEmail = process.env.RESEND_FROM_EMAIL || "informes@progresa-group.cl";

  const { error } = await resend.emails.send({
    from: `Progresa Agencia <${fromEmail}>`,
    to: toEmail,
    subject: `Propuesta Comercial #${proposal.folio} — ${proposal.name}`,
    html,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, sentTo: toEmail, acceptUrl });
}
