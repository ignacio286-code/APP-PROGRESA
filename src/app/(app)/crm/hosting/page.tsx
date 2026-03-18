"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Search, Plus, Trash2, X } from "lucide-react";

interface HostingClient {
  id: string;
  name: string;
  phone?: string;
  website?: string;
  startDate?: string;
  statusOp?: string;
  statusProg?: string;
  statusProc?: string;
  tags?: string;
  location?: string;
  hostingValue?: number;
  paid?: string;
}

const STATUS_COLORS: Record<string, string> = {
  OPERATIVO: "bg-green-100 text-green-700",
  SUSPENDIDO: "bg-red-100 text-red-700",
  PROGRESA: "bg-blue-100 text-blue-700",
  "EN PROCESO": "bg-yellow-100 text-yellow-700",
};

function StatusBadge({ label }: { label?: string }) {
  if (!label) return null;
  const cls = STATUS_COLORS[label] || "bg-gray-100 text-gray-600";
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>;
}

function formatCLP(n?: number) {
  if (!n) return "—";
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
}

const EMPTY = { name: "", phone: "", website: "", startDate: "", statusOp: "", tags: "", location: "", hostingValue: "", paid: "" };

export default function HostingPage() {
  const [items, setItems] = useState<HostingClient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetch("/api/crm/hosting").then((r) => r.json()).then(setItems).finally(() => setLoading(false)); }, []);

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este cliente?")) return;
    await fetch(`/api/crm/hosting/${id}`, { method: "DELETE" });
    setItems((p) => p.filter((i) => i.id !== id));
  }

  async function handleSave() {
    setSaving(true);
    await fetch("/api/crm/hosting", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, hostingValue: form.hostingValue ? parseFloat(form.hostingValue) : null }),
    });
    setSaving(false);
    setShowModal(false);
    setForm(EMPTY);
    const res = await fetch("/api/crm/hosting");
    setItems(await res.json());
  }

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    (i.website || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header title="Clientes con Hosting" />
      <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cliente o web..." className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-black" style={{ backgroundColor: "#FFC207" }}>
            <Plus size={16} /> Nuevo Cliente
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">{filtered.length} clientes</p>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Cargando...</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Nombre</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Sitio Web</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Inicio</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Estado</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Hosting</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Tags</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-16 text-gray-400">Sin registros. Sincroniza desde Monday en la vista CRM.</td></tr>
                )}
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <div>{c.name}</div>
                      {c.phone && <div className="text-xs text-gray-400">{c.phone}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{c.website || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{c.startDate || "—"}</td>
                    <td className="px-4 py-3"><StatusBadge label={c.statusOp} /></td>
                    <td className="px-4 py-3 font-semibold text-sm" style={{ color: "#FFC207" }}>{formatCLP(c.hostingValue)}</td>
                    <td className="px-4 py-3">
                      {c.tags && c.tags.split(",").map((t) => (
                        <span key={t} className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full mr-1">{t.trim()}</span>
                      ))}
                    </td>
                    <td className="px-4 py-3 flex justify-end">
                      <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold">Nuevo Cliente Hosting</h2>
                <button onClick={() => setShowModal(false)}><X size={20} /></button>
              </div>
              <div className="space-y-3">
                {[
                  { key: "name", label: "Nombre" },
                  { key: "phone", label: "Teléfono" },
                  { key: "website", label: "Sitio web" },
                  { key: "startDate", label: "Fecha inicio" },
                  { key: "statusOp", label: "Estado operativo" },
                  { key: "tags", label: "Tags (separados por coma)" },
                  { key: "location", label: "Ciudad" },
                  { key: "hostingValue", label: "Valor hosting (CLP)", type: "number" },
                  { key: "paid", label: "Pagado (SI/NO)" },
                ].map(({ key, label, type = "text" }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                    <input type={type} value={form[key as keyof typeof form] || ""} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm">Cancelar</button>
                <button onClick={handleSave} disabled={saving || !form.name} className="flex-1 py-2 rounded-lg text-sm font-medium text-black disabled:opacity-60" style={{ backgroundColor: "#FFC207" }}>
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
