import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const proposal = await prisma.crmProposal.findUnique({
    where: { id },
    include: { items: { orderBy: { order: "asc" } } },
  });
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(proposal);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { items, ...rest } = body;

  // Delete existing items and recreate
  await prisma.crmProposalItem.deleteMany({ where: { proposalId: id } });

  const proposal = await prisma.crmProposal.update({
    where: { id },
    data: {
      ...rest,
      issueDate: rest.issueDate ? new Date(rest.issueDate) : undefined,
      dueDate: rest.dueDate ? new Date(rest.dueDate) : null,
      items: items?.length
        ? {
            create: items.map((item: Record<string, unknown>, idx: number) => ({
              name: item.name as string,
              description: (item.description as string) || null,
              serviceId: (item.serviceId as string) || null,
              quantity: Number(item.quantity) || 1,
              unitPrice: Number(item.unitPrice) || 0,
              discount: Number(item.discount) || 0,
              tax: Number(item.tax) || 0,
              order: idx,
            })),
          }
        : undefined,
    },
    include: { items: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json(proposal);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.crmProposal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
