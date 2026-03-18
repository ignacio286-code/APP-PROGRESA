"use client";

import { useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import { Search, Plus, Trash2, ChevronDown, ChevronUp, X, Download, Upload } from "lucide-react";
import * as XLSX from "xlsx";

interface Lead {
  id: string;
  name: string;
  rut?: string;
  website?: string;
  contactDate?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  status?: string;
  location?: string;
  city?: string;
  hasSocialMedia?: string;
  workday?: string;
  objective?: string;
  selectedPlan?: string;
  webPlan?: string;
  services?: string;
}

const STATUS_COLORS: Record<string, string> = {
  Rechazo: "bg-red-100 text-red-700",
  Ganado: "bg-green-100 text-green-700",
  Propuesta: "bg-blue-100 text-blue-700",
  Contactado: "bg-yellow-100 text-yellow-700",
  Estancado: "bg-gray-100 text-gray-600",
};

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const cls = STATUS_COLORS[status] || "bg-gray-100 text-gray-600";
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{status}</span>;
}

const EMPTY: Omit<Lead, "id"> = {
  name: "", rut: "", website: "", contactPerson: "", phone: "", email: "",
  status: "", location: "", city: "", hasSocialMedia: "", workday: "",
  objective: "", selectedPlan: "", webPlan: "", services: "",
};

const COLUMNS = [
  { key: "name",          label: "Nombre" },
  { key: "rut",           label: "RUT" },
  { key: "contactPerson", label: "Encargado" },
  { key: "phone",         label: "Teléfono" },
  { key: "email",         label: "Email" },
  { key: "website",       label: "Sitio Web" },
  { key: "city",          label: "Ciudad" },
  { key: "location",      label: "Dirección" },
  { key: "status",        label: "Estado" },
  { key: "selectedPlan",  label: "Plan Seleccionado" },
  { key: "webPlan",       label: "Plan Web" },
  { key: "services",      label: "Servicios" },
  { key: "hasSocialMedia",label: "Redes Sociales" },
  { key: "workday",       label: "Jornada" },
  { key: "objective",     label: "Objetivo" },
];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<Omit<Lead, "id">>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchLeads(); }, []);

  async function fetchLeads() {
    setLoading(true);
    const res = await fetch(`/api/crm/leads?search=${encodeURIComponent(search)}`);
    setLeads(await res.json());
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este lead?")) return;
    await fetch(`/api/crm/leads/${id}`, { method: "DELETE" });
    setLeads((prev) => prev.filter((l) => l.id !== id));
  }

  async function handleSave() {
    setSaving(true);
    await fetch("/api/crm/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setShowModal(false);
    setForm(EMPTY);
    fetchLeads();
  }

  // --- EXPORT ---
  function handleExport() {
    const rows = filtered.map((l) =>
      Object.fromEntries(COLUMNS.map(({ key, label }) => [label, l[key as keyof Lead] || ""]))
    );
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clientes Potenciales");
    XLSX.writeFile(wb, "clientes_potenciales.xlsx");
  }

  // --- IMPORT ---
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
      const data: Record<string, string> = {};
      for (const [label, value] of Object.entries(row)) {
        const key = labelToKey[label];
        if (key) data[key] = String(value);
      }
      if (!data.name) continue;
      await fetch("/api/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      ok++;
    }

    setImporting(false);
    if (fileRef.current) fileRef.current.value = "";
    alert(`${ok} leads importados correctamente.`);
    fetchLeads();
  }

  const filtered = leads.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    (l.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header title="Clientes Potenciales" />
      <main className="flex-1 p-6 max-w-6xl mx-auto w-full">

        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchLeads()}
              placeholder="Buscar por nombre o email..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
          <button
            onClick={fetchLeads}
            className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm hover:bg-gray-50 transition"
          >
            Buscar
          </button>

          {/* Excel buttons */}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-green-200 bg-green-50 text-green-700 text-sm hover:bg-green-100 transition"
          >
            <Download size={15} /> Exportar Excel
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-sm hover:bg-blue-100 transition disabled:opacity-60"
          >
            <Upload size={15} /> {importing ? "Importando..." : "Importar Excel"}
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportFile} />

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-black"
            style={{ backgroundColor: "#FFC207" }}
          >
            <Plus size={16} /> Nuevo Lead
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">{filtered.length} registros</p>

        {/* Table */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Cargando...</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Nombre</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Contacto</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Ciudad</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Plan</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-gray-400">
                      No hay registros. Usa &quot;Sincronizar desde Monday&quot; o importa un Excel.
                    </td>
                  </tr>
                )}
                {filtered.map((lead) => (
                  <>
                    <tr key={lead.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-medium text-gray-900">{lead.name}</td>
                      <td className="px-4 py-3 text-gray-600">
                        <div>{lead.contactPerson}</div>
                        <div className="text-xs text-gray-400">{lead.email}</div>
                        <div className="text-xs text-gray-400">{lead.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{lead.city}</td>
                      <td className="px-4 py-3 text-gray-600">{lead.selectedPlan}</td>
                      <td className="px-4 py-3"><StatusBadge status={lead.status} /></td>
                      <td className="px-4 py-3 flex items-center gap-2 justify-end">
                        <button
                          onClick={() => setExpanded(expanded === lead.id ? null : lead.id)}
                          className="text-gray-400 hover:text-gray-700"
                        >
                          {expanded === lead.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        <button onClick={() => handleDelete(lead.id)} className="text-gray-400 hover:text-red-500">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                    {expanded === lead.id && (
                      <tr key={lead.id + "-exp"} className="bg-yellow-50/40 border-b border-gray-100">
                        <td colSpan={6} className="px-6 py-4 text-sm text-gray-700 space-y-1">
                          {lead.rut && <p><span className="font-medium">RUT:</span> {lead.rut}</p>}
                          {lead.website && <p><span className="font-medium">Web:</span> {lead.website}</p>}
                          {lead.location && <p><span className="font-medium">Dirección:</span> {lead.location}</p>}
                          {lead.services && <p><span className="font-medium">Servicios:</span> {lead.services}</p>}
                          {lead.objective && <p><span className="font-medium">Objetivo:</span> {lead.objective}</p>}
                          {lead.workday && <p><span className="font-medium">Jornada:</span> {lead.workday}</p>}
                          {lead.hasSocialMedia && <p><span className="font-medium">Redes sociales:</span> {lead.hasSocialMedia}</p>}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal nuevo lead */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold">Nuevo Lead</h2>
                <button onClick={() => setShowModal(false)}><X size={20} /></button>
              </div>
              <div className="space-y-3">
                {(["name","contactPerson","phone","email","city","status","selectedPlan","services","objective"] as const).map((field) => (
                  <div key={field}>
                    <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                      {field.replace(/([A-Z])/g, " $1")}
                    </label>
                    <input
                      value={form[field] || ""}
                      onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.name}
                  className="flex-1 py-2 rounded-lg text-sm font-medium text-black disabled:opacity-60"
                  style={{ backgroundColor: "#FFC207" }}
                >
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
