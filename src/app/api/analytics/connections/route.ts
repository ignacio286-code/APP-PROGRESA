import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");

  if (!clientId) {
    return NextResponse.json({ error: "clientId requerido" }, { status: 400 });
  }

  const connections = await prisma.socialConnection.findMany({
    where: { clientId, isActive: true },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      platform: true,
      accountId: true,
      accountName: true,
      isActive: true,
      tokenExpiry: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ connections });
}
