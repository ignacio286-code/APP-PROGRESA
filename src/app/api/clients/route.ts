import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(clients);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const client = await prisma.client.create({
      data: {
        name: data.name,
        website: data.website || null,
        industry: data.industry || null,
        wpUrl: data.wpUrl || null,
        wpUsername: data.wpUsername || null,
        wpAppPassword: data.wpAppPassword || null,
        metaAppId: data.metaAppId || null,
        metaAppSecret: data.metaAppSecret || null,
        metaAccessToken: data.metaAccessToken || null,
        metaAdAccountId: data.metaAdAccountId || null,
        googleClientId: data.googleClientId || null,
        googleClientSecret: data.googleClientSecret || null,
        googleDeveloperToken: data.googleDeveloperToken || null,
        googleCustomerId: data.googleCustomerId || null,
        nanobanaApiKey: data.nanobanaApiKey || null,
      },
    });
    return NextResponse.json(client, { status: 201 });
  } catch (err) {
    const msg = String(err);
    const isDbError = msg.includes("P1001") || msg.includes("connect") || msg.includes("ECONNREFUSED");
    const userError = isDbError
      ? "No se puede conectar a la base de datos. Asegúrate de que PostgreSQL esté corriendo y ejecuta: npx prisma migrate dev"
      : msg;
    return NextResponse.json({ error: userError }, { status: 500 });
  }
}
