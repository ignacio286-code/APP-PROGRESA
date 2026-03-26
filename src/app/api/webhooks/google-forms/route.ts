import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Webhook endpoint for Google Forms integration.
 * Called by Google Apps Script on form submit.
 *
 * Authentication: Bearer token via Authorization header
 *   Authorization: Bearer <GOOGLE_FORMS_WEBHOOK_SECRET>
 *
 * Expected body (map your form fields as needed):
 * {
 *   name: string,          // required
 *   email?: string,
 *   phone?: string,
 *   rut?: string,
 *   city?: string,
 *   location?: string,
 *   website?: string,
 *   objective?: string,
 *   services?: string,
 *   notes?: string,
 *   contactPerson?: string,
 *   status?: string,       // defaults to "Nuevo"
 * }
 */
export async function POST(req: NextRequest) {
  const secret = process.env.GOOGLE_FORMS_WEBHOOK_SECRET;

  // Validate secret token
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "").trim();

  if (!secret || token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const lead = await prisma.crmLead.create({
    data: {
      name: body.name.trim(),
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
      rut: body.rut?.trim() || null,
      city: body.city?.trim() || null,
      location: body.location?.trim() || null,
      website: body.website?.trim() || null,
      objective: body.objective?.trim() || null,
      services: body.services?.trim() || null,
      notes: body.notes?.trim() || null,
      contactPerson: body.contactPerson?.trim() || null,
      status: body.status?.trim() || "Nuevo",
      contactDate: new Date(),
    },
  });

  return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
}
