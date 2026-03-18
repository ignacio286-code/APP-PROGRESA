import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";

  const proposals = await prisma.crmProposal.findMany({
    where: search ? { name: { contains: search, mode: "insensitive" } } : {},
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(proposals);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const proposal = await prisma.crmProposal.create({ data: body });
  return NextResponse.json(proposal, { status: 201 });
}
