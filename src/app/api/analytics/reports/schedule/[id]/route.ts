import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { isActive, name, recipients, platforms } = body;

  const updated = await prisma.reportSchedule.update({
    where: { id },
    data: {
      ...(isActive !== undefined && { isActive }),
      ...(name && { name }),
      ...(recipients && { recipients }),
      ...(platforms && { platforms }),
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ schedule: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.reportSchedule.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
