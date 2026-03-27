"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Search, Users, Phone, Mail, Globe, FileText, Trash2, RefreshCw } from "lucide-react";

interface Client {
  id: string;
  name: string;
  rut?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  city?: string;
  website?: string;
  services?: string;
  selectedPlan?: string;
  status: string;
  startDate: string;
  proposal?: { folio?: string; items: { name: string }[] };
}

const STATUS_COLORS: Record<string, string> = {
  "Activo": "bg-green-100 text-green-700",
  "Suspendido": "bg-red-100 text-red-700",
  "En Proceso": "bg-yellow-100 text-yellow-700",
  "Inactivo": "bg-gray-100 text-gray-600",
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/clients?search=${encodeURIComponent(search)}`);
      setClients(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este cliente?")) return;
    setDeleting(id);
    await fetch(`/api/crm/clients/${id}`, { method: "DELETE" });
    setClients(prev => prev.filter(c => c.id !== id));
    setDeleting(null);
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/crm/clients/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setClients(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  }

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.city || "").toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === "Activo").length,
    suspended: clients.filter(c => c.status === "Suspendido").length,
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header title="Clientes Progresa" subtitle="Clientes que aceptaron una propuesta" />
      <main className="flex-1 p-4 md:p-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total clientes", value: stats.total, color: "text-blue-600 bg-blue-50" },
            { label: "Activos", value: stats.active, color: "text-green-600 bg-green-50" },
            { label: "Suspendidos", value: stats.suspended, color: "text-red-600 bg-red-50" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color.split(" ")[0]} `}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400" />
          </div>
          <button onClick={load} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <RefreshCw size={24} className="animate-spin text-gray-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Users size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium">Sin clientes aún</p>
            <p className="text-sm text-gray-400 mt-1">Los clientes aparecen aquí cuando aceptan una propuesta.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(client => (
              <div key={client.id} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">{client.name}</p>
                    {client.rut && <p className="text-xs text-gray-400">RUT: {client.rut}</p>}
                  </div>
                  <select
                    value={client.status}
                    onChange={e => updateStatus(client.id, e.target.value)}
                    className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[client.status] || "bg-gray-100 text-gray-600"}`}
                  >
                    {["Activo", "En Proceso", "Suspendido", "Inactivo"].map(s => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Info */}
                <div className="space-y-1.5 text-sm">
                  {client.contactPerson && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users size={13} className="shrink-0 text-gray-400" />
                      <span className="truncate">{client.contactPerson}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone size={13} className="shrink-0 text-gray-400" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail size={13} className="shrink-0 text-gray-400" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.website && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Globe size={13} className="shrink-0 text-gray-400" />
                      <a href={client.website} target="_blank" className="truncate hover:underline">{client.website}</a>
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {client.city && (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{client.city}</span>
                  )}
                  {client.selectedPlan && (
                    <span className="text-xs px-2 py-0.5 rounded-full text-black font-medium" style={{ backgroundColor: "#FFC207" }}>{client.selectedPlan}</span>
                  )}
                  {client.proposal?.folio && (
                    <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full flex items-center gap-1">
                      <FileText size={10} />#{client.proposal.folio}
                    </span>
                  )}
                </div>

                {/* Services */}
                {client.services && (
                  <p className="text-xs text-gray-400 line-clamp-2">{client.services}</p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-400">
                    Desde {new Date(client.startDate).toLocaleDateString("es-CL")}
                  </span>
                  <button onClick={() => handleDelete(client.id)}
                    disabled={deleting === client.id}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
