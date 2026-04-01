import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const docs = await prisma.crmDocument.findMany({
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, content: true, fileUrl: true, fileType: true, fileName: true, updatedAt: true },
    });
    return NextResponse.json(docs);
  } catch (e) {
    console.error("GET /api/crm/documents error:", e);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const doc = await prisma.crmDocument.create({
      data: {
        title: body.title,
        content: body.content ?? null,
        fileUrl: body.fileUrl ?? null,
        fileType: body.fileType ?? "text",
        fileData: body.fileData ?? null,
        fileName: body.fileName ?? null,
      },
    });
    return NextResponse.json(doc, { status: 201 });
  } catch (e) {
    console.error("POST /api/crm/documents error:", e);
    return NextResponse.json({ error: "Error al crear documento" }, { status: 500 });
  }
}
