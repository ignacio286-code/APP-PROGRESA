import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(client);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const data = await req.json();
    const client = await prisma.client.update({
      where: { id },
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
    return NextResponse.json(client);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.client.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
