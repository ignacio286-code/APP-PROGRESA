"use strict";

// Punto de entrada para Passenger (cPanel)
// Next.js standalone genera su propio server.js en .next/standalone/
// Este archivo lo delega directamente.

const path = require("path");

// ── Scheduler de informes automáticos ─────────────────────────────────────────
try {
  const cron = require("node-cron");
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Ejecuta cada día a las 8:00 AM
  cron.schedule("0 8 * * *", async () => {
    try {
      const { PrismaClient } = require("@prisma/client");
      const prisma = new PrismaClient();
      const now = new Date();

      const schedules = await prisma.reportSchedule.findMany({
        where: {
          isActive: true,
          nextSendAt: { lte: now },
        },
        include: { client: true },
      });

      for (const schedule of schedules) {
        try {
          // Generate report
          const dateTo = now.toISOString().split("T")[0];
          const dateFrom = new Date(now);
          if (schedule.frequency === "weekly") dateFrom.setDate(dateFrom.getDate() - 7);
          else dateFrom.setMonth(dateFrom.getMonth() - 1);

          const genRes = await fetch(`${BASE_URL}/api/analytics/reports/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              clientId: schedule.clientId,
              name: `${schedule.name} - ${dateTo}`,
              dateFrom: dateFrom.toISOString().split("T")[0],
              dateTo,
              platforms: schedule.platforms,
            }),
          });
          const genData = await genRes.json();

          if (genData.report) {
            // Send email
            await fetch(`${BASE_URL}/api/analytics/reports/send`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                reportId: genData.report.id,
                recipients: schedule.recipients,
              }),
            });
          }

          // Calculate next send date
          const next = new Date(now);
          if (schedule.frequency === "weekly") {
            next.setDate(next.getDate() + 7);
          } else {
            next.setMonth(next.getMonth() + 1);
          }
          next.setHours(8, 0, 0, 0);

          await prisma.reportSchedule.update({
            where: { id: schedule.id },
            data: { lastSentAt: now, nextSendAt: next },
          });
        } catch (scheduleErr) {
          console.error(`[cron] Error procesando horario ${schedule.id}:`, scheduleErr);
        }
      }

      await prisma.$disconnect();
    } catch (err) {
      console.error("[cron] Error en scheduler de informes:", err);
    }
  });

  console.log("[cron] Scheduler de informes automáticos iniciado.");
} catch (err) {
  console.warn("[cron] node-cron no disponible, scheduler desactivado.", err.message);
}
// ─────────────────────────────────────────────────────────────────────────────

// Cambia el directorio de trabajo al standalone para que los
// paths relativos internos de Next.js funcionen correctamente.
process.chdir(path.join(__dirname, ".next", "standalone"));
require(path.join(__dirname, ".next", "standalone", "server.js"));
