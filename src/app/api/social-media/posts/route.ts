import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  if (!clientId) return NextResponse.json([]);
  const posts = await prisma.scheduledPost.findMany({
    where: { clientId },
    orderBy: { scheduledAt: "asc" },
  });
  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const post = await prisma.scheduledPost.create({
    data: {
      clientId: body.clientId,
      platform: body.platform,
      content: body.content,
      mediaBase64: body.mediaBase64 ?? null,
      mediaType: body.mediaType ?? null,
      scheduledAt: new Date(body.scheduledAt),
      status: body.status ?? "draft",
    },
  });
  return NextResponse.json(post, { status: 201 });
}
