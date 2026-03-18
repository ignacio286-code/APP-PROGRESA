import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";

  const clients = await prisma.crmHostingClient.findMany({
    where: search ? { name: { contains: search, mode: "insensitive" } } : {},
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const client = await prisma.crmHostingClient.create({ data: body });
  return NextResponse.json(client, { status: 201 });
}
