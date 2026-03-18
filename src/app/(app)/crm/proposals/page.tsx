"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Search, Plus, Trash2, X } from "lucide-react";

interface Proposal {
  id: string;
  name: string;
  status?: string;
  proposalDate?: string;
  followUpDate?: string;
  notes?: string;
}

const STATUS_COLORS: Record<string, string> = {
  Ganado: "bg-green-100 text-green-700",
  Perdido: "bg-red-100 text-red-700",
  Estancado: "bg-gray-100 text-gray-600",
  Enviado: "bg-blue-100 text-blue-700",
  Pendiente: "bg-yellow-100 text-yellow-700",
};

const EMPTY = { name: "", status: "", proposalDate: "", followUpDate: "", notes: "" };

export default function ProposalsPage() {
  const [items, setItems] = useState<Proposal[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetch("/api/crm/proposals").then((r) => r.json()).then(setItems).finally(() => setLoading(false)); }, []);

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta propuesta?")) return;
    await fetch(`/api/crm/proposals/${id}`, { method: "DELETE" });
    setItems((p) => p.filter((i) => i.id !== id));
  }

  async function handleSave() {
    setSaving(true);
    const body = {
      ...form,
      proposalDate: form.proposalDate || null,
      followUpDate: form.followUpDate || null,
    };
    await fetch("/api/crm/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setShowModal(false);
    setForm(EMPTY);
    const res = await fetch("/api/crm/proposals");
    setItems(await res.json());
  }

  const filtered = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header title="Propuestas" />
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-black" style={{ backgroundColor: "#FFC207" }}>
            <Plus size={16} /> Nueva Propuesta
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">{filtered.length} propuestas</p>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Cargando...</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Nombre</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Estado</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Fecha Propuesta</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Seguimiento</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-16 text-gray-400">Sin registros. Sincroniza desde Monday en la vista CRM.</td></tr>
                )}
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-3">
                      {p.status && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status] || "bg-gray-100 text-gray-600"}`}>
                          {p.status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.proposalDate ? new Date(p.proposalDate).toLocaleDateString("es-CL") : "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{p.followUpDate ? new Date(p.followUpDate).toLocaleDateString("es-CL") : "—"}</td>
                    <td className="px-4 py-3 flex justify-end">
                      <button onClick={() => handleDelete(p.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
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
                <h2 className="text-lg font-semibold">Nueva Propuesta</h2>
                <button onClick={() => setShowModal(false)}><X size={20} /></button>
              </div>
              <div className="space-y-3">
                {[
                  { key: "name", label: "Nombre cliente" },
                  { key: "status", label: "Estado" },
                  { key: "proposalDate", label: "Fecha propuesta", type: "date" },
                  { key: "followUpDate", label: "Fecha seguimiento", type: "date" },
                  { key: "notes", label: "Notas" },
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
