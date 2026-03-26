import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function calcNextSend(frequency: string, dayOfWeek?: number, dayOfMonth?: number): Date {
  const now = new Date();
  const next = new Date(now);

  if (frequency === "weekly" && dayOfWeek !== undefined) {
    const currentDay = now.getDay();
    const daysUntil = (dayOfWeek - currentDay + 7) % 7 || 7;
    next.setDate(now.getDate() + daysUntil);
    next.setHours(8, 0, 0, 0);
  } else if (frequency === "monthly" && dayOfMonth !== undefined) {
    next.setDate(dayOfMonth);
    next.setHours(8, 0, 0, 0);
    if (next <= now) {
      next.setMonth(next.getMonth() + 1);
    }
  }

  return next;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");

  if (!clientId) return NextResponse.json({ error: "clientId requerido" }, { status: 400 });

  const schedules = await prisma.reportSchedule.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ schedules });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { clientId, name, frequency, dayOfWeek, dayOfMonth, recipients, platforms } = body;

  if (!clientId || !name || !frequency || !recipients?.length || !platforms?.length) {
    return NextResponse.json({ error: "Parámetros incompletos" }, { status: 400 });
  }

  const nextSendAt = calcNextSend(frequency, dayOfWeek, dayOfMonth);

  const schedule = await prisma.reportSchedule.create({
    data: {
      clientId,
      name,
      frequency,
      dayOfWeek: dayOfWeek ?? null,
      dayOfMonth: dayOfMonth ?? null,
      recipients,
      platforms,
      nextSendAt,
    },
  });

  return NextResponse.json({ schedule });
}
