import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function generateFolio() {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";

  const proposals = await prisma.crmProposal.findMany({
    where: {
      AND: [
        search ? { name: { contains: search, mode: "insensitive" } } : {},
        status ? { status } : {},
      ],
    },
    include: { items: { orderBy: { order: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(proposals);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { items, ...rest } = body;

  const folio = generateFolio();

  const proposal = await prisma.crmProposal.create({
    data: {
      ...rest,
      folio,
      issueDate: rest.issueDate ? new Date(rest.issueDate) : new Date(),
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

  return NextResponse.json(proposal, { status: 201 });
}
