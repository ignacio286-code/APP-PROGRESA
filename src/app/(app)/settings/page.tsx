"use client";

import Header from "@/components/Header";
import { useState } from "react";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div>
      <Header title="Configuración" subtitle="Ajustes de la plataforma" />
      <div className="p-6 max-w-2xl space-y-6">
        {/* Company */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Información de la empresa</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre empresa</label>
                <input defaultValue="MarketPro" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sitio web</label>
                <input defaultValue="https://marketpro.com" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email de contacto</label>
              <input type="email" defaultValue="admin@marketpro.com" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
            </div>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-sm font-semibold text-black hover:opacity-90"
              style={{ backgroundColor: "#FFC207" }}
            >
              {saved ? "✓ Guardado" : "Guardar cambios"}
            </button>
          </form>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Notificaciones</h2>
          <div className="space-y-3">
            {[
              { label: "Campaña iniciada", desc: "Notificar cuando una campaña comience" },
              { label: "Presupuesto al 80%", desc: "Alerta cuando el gasto llegue al 80%" },
              { label: "Campaña finalizada", desc: "Notificar cuando una campaña termine" },
              { label: "Nuevo miembro", desc: "Notificar cuando se agregue un miembro" },
            ].map((n) => (
              <div key={n.label} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{n.label}</p>
                  <p className="text-xs text-gray-400">{n.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-yellow-400 transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
