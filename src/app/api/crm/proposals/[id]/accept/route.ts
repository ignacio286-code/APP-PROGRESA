import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const proposal = await prisma.crmProposal.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Mark proposal as accepted
  await prisma.crmProposal.update({
    where: { id },
    data: { status: "Ganado", acceptedAt: new Date() },
  });

  // Update lead if linked
  if (proposal.leadId) {
    await prisma.crmLead.update({
      where: { id: proposal.leadId },
      data: { status: "Cliente", convertedAt: new Date() },
    });
  }

  // Create or update CrmClient
  const existingClient = await prisma.crmClient.findUnique({ where: { proposalId: id } });
  if (!existingClient) {
    // Get lead info if available
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
        proposalId: id,
        startDate: new Date(),
      },
    });
  }

  return NextResponse.json({ ok: true });
}
