import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");

  if (!clientId) return NextResponse.json({ error: "clientId requerido" }, { status: 400 });

  const reports = await prisma.analyticsReport.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      dateFrom: true,
      dateTo: true,
      platforms: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ reports });
}
