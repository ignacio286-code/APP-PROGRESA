import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

async function acceptProposal(token: string) {
  "use server";
  const proposal = await prisma.crmProposal.findUnique({ where: { acceptToken: token } });
  if (!proposal) return;

  await prisma.crmProposal.update({
    where: { id: proposal.id },
    data: { status: "Ganado", acceptedAt: new Date() },
  });

  if (proposal.leadId) {
    await prisma.crmLead.update({
      where: { id: proposal.leadId },
      data: { status: "Cliente", convertedAt: new Date() },
    });
  }

  const exists = await prisma.crmClient.findUnique({ where: { proposalId: proposal.id } });
  if (!exists) {
    const lead = proposal.leadId
      ? await prisma.crmLead.findUnique({ where: { id: proposal.leadId } })
      : null;
    await prisma.crmClient.create({
      data: {
        name: proposal.name,
        rut: proposal.clientRut || lead?.rut || null,
        email: proposal.clientEmail || lead?.email || null,
        phone: proposal.clientPhone || lead?.phone || null,
        address: proposal.clientAddress || lead?.location || null,
        city: lead?.city || null,
        website: lead?.website || null,
        contactPerson: lead?.contactPerson || null,
        cargo: lead?.cargo || null,
        services: lead?.services || null,
        selectedPlan: lead?.selectedPlan || null,
        budget: lead?.budget || null,
        objective: lead?.objective || null,
        status: "Activo",
        leadId: proposal.leadId || null,
        proposalId: proposal.id,
        startDate: new Date(),
      },
    });
  }
}

export default async function ProposalAcceptPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const proposal = await prisma.crmProposal.findUnique({
    where: { acceptToken: token },
    include: { items: { orderBy: { order: "asc" } } },
  });

  if (!proposal) notFound();

  const alreadyAccepted = !!proposal.acceptedAt;

  if (!alreadyAccepted) {
    await acceptProposal(token);
  }

  const subtotal = proposal.items.reduce((s, i) => {
    const base = i.quantity * i.unitPrice;
    return s + base - base * (i.discount / 100);
  }, 0);
  const tax = proposal.items.reduce((s, i) => {
    const base = i.quantity * i.unitPrice;
    return s + (base - base * (i.discount / 100)) * (i.tax / 100);
  }, 0);
  const total = subtotal + tax;

  const fmt = (n: number) =>
    new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-4xl font-black text-black">Progresa</span>
          <span className="text-xl font-semibold italic ml-2" style={{ color: "#FFC207" }}>Agencia</span>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Success header */}
          <div className="p-8 text-center border-b border-gray-100">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {alreadyAccepted ? "Propuesta ya aceptada" : "¡Propuesta Aceptada!"}
            </h1>
            <p className="text-gray-500 text-sm">
              {alreadyAccepted
                ? "Esta propuesta fue aceptada previamente."
                : "Hemos recibido tu aceptación. Nuestro equipo se pondrá en contacto pronto."}
            </p>
          </div>

          {/* Proposal summary */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-gray-900 text-lg">{proposal.name}</p>
                <p className="text-sm text-gray-500">Propuesta #{proposal.folio}</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-green-500">
                Aceptada
              </span>
            </div>

            <div className="space-y-2 mb-4">
              {proposal.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.name} x{item.quantity}</span>
                  <span className="font-medium">
                    {fmt(item.quantity * item.unitPrice * (1 - item.discount / 100))}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t pt-3 text-right">
              {tax > 0 && (
                <p className="text-sm text-gray-500 mb-1">IVA: {fmt(tax)}</p>
              )}
              <p className="text-xl font-black">Total: <span style={{ color: "#FFC207" }}>{fmt(total)}</span></p>
            </div>
          </div>

          <div className="px-6 pb-6 text-center">
            <p className="text-sm text-gray-400">
              ¿Tienes preguntas? Contáctanos a través de{" "}
              <a href="mailto:contacto@progresa-group.cl" className="text-black font-medium">
                contacto@progresa-group.cl
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
