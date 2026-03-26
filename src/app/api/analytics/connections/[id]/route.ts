import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.socialConnection.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ ok: true });
}
