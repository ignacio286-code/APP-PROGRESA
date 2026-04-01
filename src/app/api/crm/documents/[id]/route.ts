import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await prisma.crmDocument.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(doc);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const doc = await prisma.crmDocument.update({
    where: { id },
    data: {
      title: body.title,
      content: body.content ?? null,
      fileUrl: body.fileUrl ?? null,
      fileType: body.fileType ?? "text",
      fileData: body.fileData ?? null,
      fileName: body.fileName ?? null,
    },
  });
  return NextResponse.json(doc);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.crmDocument.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
