import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";

  const services = await prisma.crmService.findMany({
    where: search ? { name: { contains: search, mode: "insensitive" } } : {},
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(services);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const service = await prisma.crmService.create({ data: body });
  return NextResponse.json(service, { status: 201 });
}
