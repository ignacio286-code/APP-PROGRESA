"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { mockCampaigns, statusColors, statusLabels } from "@/lib/mock-data";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });

  const { year, month } = currentDate;
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  function prevMonth() {
    setCurrentDate(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
    );
  }

  function nextMonth() {
    setCurrentDate(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
    );
  }

  function getCampaignsForDay(day: number) {
    const date = new Date(year, month, day);
    return mockCampaigns.filter((c) => {
      const start = new Date(c.startDate);
      const end = new Date(c.endDate);
      return date >= start && date <= end;
    });
  }

  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div>
      <Header title="Calendario" subtitle="Vista de campañas por fecha" />

      <div className="p-6 space-y-4">
        {/* Legend */}
        <div className="flex flex-wrap gap-3">
          {mockCampaigns.map((c) => (
            <div key={c.id} className="flex items-center gap-1.5 text-xs text-gray-600">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#FFC207" }} />
              {c.name}
            </div>
          ))}
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Nav */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-base font-bold text-gray-900">
              {MONTHS[month]} {year}
            </h2>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Days header */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DAYS.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400">
                {d}
              </div>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              const campaigns = day ? getCampaignsForDay(day) : [];
              const isToday =
                day === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear();

              return (
                <div
                  key={idx}
                  className={`min-h-24 p-2 border-b border-r border-gray-50 ${
                    !day ? "bg-gray-50/50" : "hover:bg-gray-50/50"
                  }`}
                >
                  {day && (
                    <>
                      <span
                        className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                          isToday ? "text-black" : "text-gray-600"
                        }`}
                        style={isToday ? { backgroundColor: "#FFC207" } : {}}
                      >
                        {day}
                      </span>
                      <div className="space-y-0.5">
                        {campaigns.slice(0, 3).map((c) => (
                          <div
                            key={c.id}
                            className="text-xs px-1.5 py-0.5 rounded font-medium truncate text-black"
                            style={{ backgroundColor: "#FFC20740" }}
                            title={c.name}
                          >
                            {c.name}
                          </div>
                        ))}
                        {campaigns.length > 3 && (
                          <div className="text-xs text-gray-400">+{campaigns.length - 3} más</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Timeline de Campañas</h2>
          <div className="space-y-3">
            {mockCampaigns.map((c) => {
              const start = new Date(c.startDate);
              const end = new Date(c.endDate);
              const daysDuration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
              return (
                <div key={c.id} className="flex items-center gap-4">
                  <div className="w-48 shrink-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.startDate} → {c.endDate}</p>
                  </div>
                  <div className="flex-1 relative h-7 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="absolute inset-y-0 rounded-lg flex items-center px-2"
                      style={{
                        backgroundColor: "#FFC207",
                        left: "0%",
                        width: `${Math.min(100, Math.max(10, (daysDuration / 365) * 100))}%`,
                      }}
                    >
                      <span className="text-xs font-semibold text-black truncate">{daysDuration}d</span>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${statusColors[c.status]}`}
                  >
                    {statusLabels[c.status]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
