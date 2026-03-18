"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Link from "next/link";
import { Users, FileText, Package, Server, RefreshCw, ArrowRight } from "lucide-react";

interface Stats {
  leads: number;
  proposals: number;
  services: number;
  hosting: number;
}

const sections = [
  {
    href: "/crm/leads",
    label: "Clientes Potenciales",
    icon: Users,
    key: "leads" as keyof Stats,
    description: "Prospectos y leads del área comercial",
    color: "bg-blue-50 text-blue-600",
  },
  {
    href: "/crm/proposals",
    label: "Propuestas",
    icon: FileText,
    key: "proposals" as keyof Stats,
    description: "Propuestas enviadas y su estado",
    color: "bg-purple-50 text-purple-600",
  },
  {
    href: "/crm/services",
    label: "Servicios",
    icon: Package,
    key: "services" as keyof Stats,
    description: "Catálogo de servicios disponibles",
    color: "bg-green-50 text-green-600",
  },
  {
    href: "/crm/hosting",
    label: "Clientes con Hosting",
    icon: Server,
    key: "hosting" as keyof Stats,
    description: "Clientes activos con servicio de hosting",
    color: "bg-orange-50 text-orange-600",
  },
];

export default function CrmPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const [leads, proposals, services, hosting] = await Promise.all([
        fetch("/api/crm/leads").then((r) => r.json()),
        fetch("/api/crm/proposals").then((r) => r.json()),
        fetch("/api/crm/services").then((r) => r.json()),
        fetch("/api/crm/hosting").then((r) => r.json()),
      ]);
      setStats({
        leads: leads.length,
        proposals: proposals.length,
        services: services.length,
        hosting: hosting.length,
      });
    } catch {
      // DB might not be ready yet
    }
  }

  async function handleImport() {
    setImporting(true);
    setImportResult(null);
    try {
      const res = await fetch("/api/crm/import", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        const { leads, proposals, services, hosting } = data.imported;
        setImportResult(
          `✓ Importado: ${leads} leads, ${proposals} propuestas, ${services} servicios, ${hosting} clientes hosting`
        );
        fetchStats();
      } else {
        setImportResult("Error: " + (data.error || "desconocido"));
      }
    } catch {
      setImportResult("Error al importar");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header title="CRM — Área Comercial" />
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">

        {/* Import button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-gray-500 text-sm">
              Gestión comercial: prospectos, propuestas, servicios y clientes de hosting.
            </p>
            {importResult && (
              <p className={`text-sm mt-1 font-medium ${importResult.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>
                {importResult}
              </p>
            )}
          </div>
          <button
            onClick={handleImport}
            disabled={importing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-black transition-all disabled:opacity-60"
            style={{ backgroundColor: "#FFC207" }}
          >
            <RefreshCw size={16} className={importing ? "animate-spin" : ""} />
            {importing ? "Importando..." : "Sincronizar desde Monday"}
          </button>
        </div>

        {/* Section cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {sections.map(({ href, label, icon: Icon, key, description, color }) => (
            <Link
              key={href}
              href={href}
              className="bg-white rounded-2xl border border-gray-200 p-6 flex items-start gap-4 hover:shadow-md transition-shadow group"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{label}</h3>
                  <ArrowRight size={16} className="text-gray-400 group-hover:text-gray-700 transition-colors" />
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{description}</p>
                {stats !== null && (
                  <p className="text-2xl font-bold mt-3" style={{ color: "#FFC207" }}>
                    {stats[key]}
                    <span className="text-sm font-normal text-gray-400 ml-1">registros</span>
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
