"use client";

import { useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import { Search, Plus, Trash2, X, Download, Upload, Edit2 } from "lucide-react";
import * as XLSX from "xlsx";

interface Service {
  id: string;
  name: string;
  description?: string;
  price?: number;
  notes?: string;
}

const EMPTY = { name: "", description: "", price: "", notes: "" };

function formatCLP(n?: number) {
  if (!n) return "—";
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
}

const COLUMNS = [
  { key: "name",        label: "Nombre" },
  { key: "description", label: "Descripción" },
  { key: "price",       label: "Precio (CLP)" },
  { key: "notes",       label: "Notas" },
];

export default function ServicesPage() {
  const [items, setItems] = useState<Service[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchServices(); }, []);

  async function fetchServices() {
    const res = await fetch("/api/crm/services");
    setItems(await res.json());
    setLoading(false);
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY);
    setShowModal(true);
  }

  function openEdit(s: Service) {
    setEditingId(s.id);
    setForm({ name: s.name, description: s.description || "", price: s.price?.toString() || "", notes: s.notes || "" });
    setShowModal(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este servicio?")) return;
    await fetch(`/api/crm/services/${id}`, { method: "DELETE" });
    setItems((p) => p.filter((i) => i.id !== id));
  }

  async function handleSave() {
    setSaving(true);
    const body = { ...form, price: form.price ? parseFloat(form.price) : null };
    if (editingId) {
      await fetch(`/api/crm/services/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/crm/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }
    setSaving(false);
    setShowModal(false);
    setForm(EMPTY);
    fetchServices();
  }

  function handleExport() {
    const rows = filtered.map((s) => ({
      Nombre: s.name,
      Descripción: s.description || "",
      "Precio (CLP)": s.price || "",
      Notas: s.notes || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Servicios");
    XLSX.writeFile(wb, "servicios.xlsx");
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws);
    const labelToKey = Object.fromEntries(COLUMNS.map(({ key, label }) => [label, key]));
    let ok = 0;
    for (const row of rows) {
      const data: Record<string, string | number | null> = {};
      for (const [label, value] of Object.entries(row)) {
        const key = labelToKey[label];
        if (key === "price") data[key] = value ? parseFloat(String(value)) : null;
        else if (key) data[key] = String(value);
      }
      if (!data.name) continue;
      await fetch("/api/crm/services", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      ok++;
    }
    setImporting(false);
    if (fileRef.current) fileRef.current.value = "";
    alert(`${ok} servicios importados correctamente.`);
    fetchServices();
  }

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    (i.description || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header title="Catálogo de Servicios" />
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar servicio..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
          </div>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-green-200 bg-green-50 text-green-700 text-sm hover:bg-green-100 transition">
            <Download size={15} /> Exportar Excel
          </button>
          <button onClick={() => fileRef.current?.click()} disabled={importing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-sm hover:bg-blue-100 transition disabled:opacity-60">
            <Upload size={15} /> {importing ? "Importando..." : "Importar Excel"}
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportFile} />
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-black" style={{ backgroundColor: "#FFC207" }}>
            <Plus size={16} /> Nuevo Servicio
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">{filtered.length} servicios</p>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Cargando...</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Servicio</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Descripción</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Precio</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Notas</th>
                  <th className="px-4 py-3 w-20" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-16 text-gray-400">Sin registros. Agrega servicios manualmente o importa un Excel.</td></tr>
                )}
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{s.description || "—"}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: "#FFC207" }}>{formatCLP(s.price)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{s.notes || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => openEdit(s)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(s.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                          <Trash2 size={14} />
                        </button>
                      </div>
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
                <h2 className="text-lg font-semibold">{editingId ? "Editar Servicio" : "Nuevo Servicio"}</h2>
                <button onClick={() => setShowModal(false)}><X size={20} /></button>
              </div>
              <div className="space-y-3">
                {[
                  { key: "name",        label: "Nombre *" },
                  { key: "description", label: "Descripción" },
                  { key: "price",       label: "Precio (CLP)", type: "number" },
                  { key: "notes",       label: "Notas" },
                ].map(({ key, label, type = "text" }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                    <input
                      type={type}
                      value={form[key as keyof typeof form] || ""}
                      onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm">Cancelar</button>
                <button onClick={handleSave} disabled={saving || !form.name}
                  className="flex-1 py-2 rounded-lg text-sm font-medium text-black disabled:opacity-60"
                  style={{ backgroundColor: "#FFC207" }}>
                  {saving ? "Guardando..." : editingId ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
