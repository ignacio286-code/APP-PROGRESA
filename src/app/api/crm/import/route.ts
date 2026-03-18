import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BOARD_IDS = {
  leads: "7366487148",
  proposals: "7366487150",
  services: "7366487146",
  hosting: "6264048712",
};

type MondayColumnValue = { id: string; text: string | null; value: string | null };
type MondayItem = { id: string; name: string; column_values: MondayColumnValue[] };

async function mondayQuery(query: string) {
  const token = process.env.MONDAY_API_TOKEN;
  if (!token) throw new Error("MONDAY_API_TOKEN no está configurado");

  const res = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
      "API-Version": "2024-01",
    },
    body: JSON.stringify({ query }),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Monday API error: ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

async function fetchBoardItems(boardId: string): Promise<MondayItem[]> {
  const items: MondayItem[] = [];
  let cursor: string | null = null;

  do {
    const cursorArg = cursor ? `, cursor: "${cursor}"` : "";
    const data = await mondayQuery(`{
      boards(ids: [${boardId}]) {
        items_page(limit: 500${cursorArg}) {
          cursor
          items {
            id
            name
            column_values { id text value }
          }
        }
      }
    }`);

    const page = data.boards[0]?.items_page;
    if (!page) break;
    items.push(...page.items);
    cursor = page.cursor ?? null;
  } while (cursor);

  return items;
}

function col(item: MondayItem, id: string): string {
  return item.column_values.find((c) => c.id === id)?.text || "";
}

function colLink(item: MondayItem, id: string): string {
  const cv = item.column_values.find((c) => c.id === id);
  if (!cv?.value) return cv?.text || "";
  try {
    const parsed = JSON.parse(cv.value);
    return parsed.url || parsed.text || cv.text || "";
  } catch {
    return cv.text || "";
  }
}

export async function POST() {
  try {
    const [leadItems, proposalItems, serviceItems, hostingItems] = await Promise.all([
      fetchBoardItems(BOARD_IDS.leads),
      fetchBoardItems(BOARD_IDS.proposals),
      fetchBoardItems(BOARD_IDS.services),
      fetchBoardItems(BOARD_IDS.hosting),
    ]);

    // --- Clientes Potenciales ---
    let leads = 0;
    for (const item of leadItems) {
      const contactDateStr = col(item, "fecha__1");
      await prisma.crmLead.upsert({
        where: { mondayId: item.id },
        create: {
          mondayId: item.id,
          name: item.name,
          rut: col(item, "text"),
          website: colLink(item, "enlace__1"),
          contactDate: contactDateStr ? new Date(contactDateStr) : null,
          contactPerson: col(item, "text_1"),
          phone: col(item, "phone"),
          email: col(item, "email"),
          status: col(item, "estado__1"),
          location: col(item, "location"),
          city: col(item, "location__1"),
          hasSocialMedia: col(item, "tiene_redes_sociales__1"),
          workday: col(item, "text5__1"),
          objective: col(item, "objetivo_de_la_empresa__1"),
          selectedPlan: col(item, "plan_seleccionado__1"),
          webPlan: col(item, "plan_web__1"),
          services: col(item, "servicios_solicitados5__1"),
        },
        update: {
          name: item.name,
          rut: col(item, "text"),
          website: colLink(item, "enlace__1"),
          contactPerson: col(item, "text_1"),
          phone: col(item, "phone"),
          email: col(item, "email"),
          status: col(item, "estado__1"),
          hasSocialMedia: col(item, "tiene_redes_sociales__1"),
          objective: col(item, "objetivo_de_la_empresa__1"),
          selectedPlan: col(item, "plan_seleccionado__1"),
          webPlan: col(item, "plan_web__1"),
          services: col(item, "servicios_solicitados5__1"),
        },
      });
      leads++;
    }

    // --- Propuestas ---
    let proposals = 0;
    for (const item of proposalItems) {
      const proposalDateStr = col(item, "date");
      const followUpDateStr = col(item, "date_1");
      await prisma.crmProposal.upsert({
        where: { mondayId: item.id },
        create: {
          mondayId: item.id,
          name: item.name,
          status: col(item, "estado__1"),
          proposalDate: proposalDateStr ? new Date(proposalDateStr) : null,
          followUpDate: followUpDateStr ? new Date(followUpDateStr) : null,
        },
        update: {
          name: item.name,
          status: col(item, "estado__1"),
          proposalDate: proposalDateStr ? new Date(proposalDateStr) : null,
          followUpDate: followUpDateStr ? new Date(followUpDateStr) : null,
        },
      });
      proposals++;
    }

    // --- Servicios ---
    let services = 0;
    for (const item of serviceItems) {
      const priceStr = col(item, "numbers");
      await prisma.crmService.upsert({
        where: { mondayId: item.id },
        create: {
          mondayId: item.id,
          name: item.name,
          description: col(item, "text"),
          price: priceStr ? parseFloat(priceStr) : null,
        },
        update: {
          name: item.name,
          description: col(item, "text"),
          price: priceStr ? parseFloat(priceStr) : null,
        },
      });
      services++;
    }

    // --- Clientes con Hosting ---
    let hosting = 0;
    for (const item of hostingItems) {
      const hostingVal = col(item, "valor_hosting");
      await prisma.crmHostingClient.upsert({
        where: { mondayId: item.id },
        create: {
          mondayId: item.id,
          name: item.name,
          phone: col(item, "telefono5"),
          website: col(item, "texto"),
          startDate: col(item, "fecha_inicio3"),
          statusOp: col(item, "status_15"),
          statusProg: col(item, "status_1"),
          statusProc: col(item, "status_11"),
          tags: col(item, "etiquetas"),
          location: col(item, "location"),
          hostingValue: hostingVal ? parseFloat(hostingVal) : null,
          paid: col(item, "estado_1"),
        },
        update: {
          name: item.name,
          phone: col(item, "telefono5"),
          website: col(item, "texto"),
          statusOp: col(item, "status_15"),
          statusProg: col(item, "status_1"),
          statusProc: col(item, "status_11"),
          tags: col(item, "etiquetas"),
          hostingValue: hostingVal ? parseFloat(hostingVal) : null,
          paid: col(item, "estado_1"),
        },
      });
      hosting++;
    }

    return NextResponse.json({
      ok: true,
      imported: { leads, proposals, services, hosting },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
