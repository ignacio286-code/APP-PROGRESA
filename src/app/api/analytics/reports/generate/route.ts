import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function fetchPlatformMetrics(clientId: string, platform: string, from: string, to: string) {
  const res = await fetch(
    `${BASE_URL}/api/analytics/${platform}/metrics?clientId=${clientId}&from=${from}&to=${to}`
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { clientId, name, dateFrom, dateTo, platforms } = body;

  if (!clientId || !name || !dateFrom || !dateTo || !platforms?.length) {
    return NextResponse.json({ error: "Parámetros incompletos" }, { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

  // Gather metrics for all requested platforms
  const reportData: Record<string, unknown> = {
    client: { id: client.id, name: client.name, website: client.website, logoUrl: client.logoUrl },
    generatedAt: new Date().toISOString(),
  };

  for (const platform of platforms) {
    const metrics = await fetchPlatformMetrics(clientId, platform, dateFrom, dateTo);
    reportData[platform] = metrics;
  }

  const report = await prisma.analyticsReport.create({
    data: {
      clientId,
      name,
      dateFrom: new Date(dateFrom),
      dateTo: new Date(dateTo),
      platforms,
      reportData: reportData as Parameters<typeof prisma.analyticsReport.create>[0]["data"]["reportData"],
    },
  });

  return NextResponse.json({ report });
}
