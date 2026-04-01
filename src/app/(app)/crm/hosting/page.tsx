"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Header from "@/components/Header";
import { Search, Plus, Trash2, X, Filter, Edit2, Check, Download, Upload } from "lucide-react";
import * as XLSX from "xlsx";

interface Service { id: string; name: string; price?: number; }

interface HostingClient {
  id: string;
  name: string;
  phone?: string;
  website?: string;
  startDate?: string;
  statusOp?: string;
  tags?: string;
  location?: string;
  hostingValue?: number;
  paid?: string;
  lastPaymentDate?: string;
  serviceId?: string;
}

const STATUS_OPTIONS = ["OPERATIVO", "SUSPENDIDO", "PROGRESA", "EN PROCESO"];
const PAID_OPTIONS = ["SI", "NO", "PENDIENTE"];

const STATUS_COLORS: Record<string, string> = {
  OPERATIVO:    "bg-green-100 text-green-700",
  SUSPENDIDO:   "bg-red-100 text-red-700",
  PROGRESA:     "bg-blue-100 text-blue-700",
  "EN PROCESO": "bg-yellow-100 text-yellow-700",
};

const PAID_COLORS: Record<string, string> = {
  SI:        "bg-green-100 text-green-700",
  NO:        "bg-red-100 text-red-700",
  PENDIENTE: "bg-yellow-100 text-yellow-700",
};

function clp(n?: number) {
  if (!n) return "—";
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
}

const EMPTY = (): Omit<HostingClient, "id"> => ({
  name: "", phone: "", website: "", startDate: "",
  statusOp: "OPERATIVO", tags: "", location: "", hostingValue: 0, paid: "PENDIENTE", lastPaymentDate: "", serviceId: "",
});

export default function HostingPage() {
  const [items, setItems] = useState<HostingClient[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPaid, setFilterPaid] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<HostingClient | null>(null);
  const [form, setForm] = useState<Omit<HostingClient, "id">>(EMPTY());
  const [saving, setSaving] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const [hostRes, svcRes] = await Promise.all([
      fetch("/api/crm/hosting"),
      fetch("/api/crm/services"),
    ]);
    setItems(await hostRes.json());
    setServices(await svcRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const filtered = items.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.website || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.location || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || c.statusOp === filterStatus;
    const matchPaid = !filterPaid || (c.paid || "").toUpperCase() === filterPaid;
    return matchSearch && matchStatus && matchPaid;
  });

  // Annual billing stats
  const totalValueAnual = filtered.reduce((sum, c) => sum + (c.hostingValue || 0), 0);
  const activeCount = filtered.filter((c) => c.statusOp === "OPERATIVO").length;
  const paidCount = filtered.filter((c) => (c.paid || "").toUpperCase() === "SI").length;
  const pendingValue = filtered
    .filter((c) => (c.paid || "").toUpperCase() !== "SI")
    .reduce((sum, c) => sum + (c.hostingValue || 0), 0);

  function openCreate() { setEditItem(null); setForm(EMPTY()); setShowModal(true); }
  function openEdit(c: HostingClient) {
    setEditItem(c);
    setForm({ name: c.name, phone: c.phone || "", website: c.website || "", startDate: c.startDate || "",
      statusOp: c.statusOp || "OPERATIVO", tags: c.tags || "", location: c.location || "",
      hostingValue: c.hostingValue || 0, paid: c.paid || "PENDIENTE", lastPaymentDate: c.lastPaymentDate || "", serviceId: c.serviceId || "" });
    setShowModal(true);
  }

  function handleServiceSelect(serviceId: string) {
    const svc = services.find(s => s.id === serviceId);
    setForm(f => ({ ...f, serviceId, hostingValue: svc?.price || f.hostingValue }));
  }

  async function handleSave() {
    setSaving(true);
    if (editItem) {
      await fetch(`/api/crm/hosting/${editItem.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    } else {
      await fetch("/api/crm/hosting", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    }
    setSaving(false); setShowModal(false); fetchItems();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este cliente?")) return;
    await fetch(`/api/crm/hosting/${id}`, { method: "DELETE" });
    setItems((p) => p.filter((i) => i.id !== id));
  }

  async function togglePaid(c: HostingClient) {
    const newPaid = (c.paid || "").toUpperCase() === "SI" ? "NO" : "SI";
    await fetch(`/api/crm/hosting/${c.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...c, paid: newPaid }) });
    setItems((prev) => prev.map((i) => i.id === c.id ? { ...i, paid: newPaid } : i));
  }

  // ── Excel export / import ──────────────────────────────────────────────────

  function handleExport() {
    const rows = items.map((c) => ({
      Nombre: c.name || "",
      Telefono: c.phone || "",
      "Sitio Web": c.website || "",
      "Fecha Inicio": c.startDate || "",
      "Estado Op": c.statusOp || "",
      "Estado Prog": c.tags || "",
      Pagado: c.paid || "",
      "Valor Hosting": c.hostingValue || 0,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clientes Hosting");
    XLSX.writeFile(wb, "clientes_hosting.xlsx");
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws);
    const labelToKey: Record<string, string> = {
      Nombre: "name", Telefono: "phone", "Sitio Web": "website",
      "Fecha Inicio": "startDate", "Estado Op": "statusOp",
      "Estado Prog": "tags", Pagado: "paid", "Valor Hosting": "hostingValue",
    };
    let ok = 0;
    for (const row of rows) {
      const data: Record<string, unknown> = {};
      for (const [label, value] of Object.entries(row)) {
        const key = labelToKey[label];
        if (key) data[key] = key === "hostingValue" ? Number(value) || 0 : String(value);
      }
      if (!data.name) continue;
      await fetch("/api/crm/hosting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      ok++;
    }
    setImporting(false);
    if (fileRef.current) fileRef.current.value = "";
    alert(`${ok} clientes importados.`);
    fetchItems();
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header title="Clientes con Hosting" />
      <main className="flex-1 p-6 max-w-6xl mx-auto w-full">

        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cliente, web o ciudad..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
          </div>
          <button onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition ${showFilters ? "border-yellow-400 bg-yellow-50 text-yellow-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            <Filter size={15} /> Filtros {(filterStatus || filterPaid) && <span className="bg-yellow-400 text-black text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">{[filterStatus, filterPaid].filter(Boolean).length}</span>}
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-black" style={{ backgroundColor: "#FFC207" }}>
            <Plus size={16} /> Nuevo Cliente
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-green-200 bg-green-50 text-green-700 text-sm hover:bg-green-100 transition"
          >
            <Download size={15} /> Exportar
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-sm hover:bg-blue-100 disabled:opacity-60 transition"
          >
            <Upload size={15} /> {importing ? "Importando..." : "Importar Excel"}
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportFile} />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex flex-wrap gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setFilterStatus("")} className={`px-3 py-1 rounded-full text-xs font-medium border transition ${!filterStatus ? "border-yellow-400 bg-yellow-100 text-yellow-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>Todos</button>
                {STATUS_OPTIONS.map((s) => (
                  <button key={s} onClick={() => setFilterStatus(filterStatus === s ? "" : s)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition ${filterStatus === s ? `border-transparent ${STATUS_COLORS[s]}` : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>{s}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Pago</label>
              <div className="flex gap-2">
                <button onClick={() => setFilterPaid("")} className={`px-3 py-1 rounded-full text-xs font-medium border transition ${!filterPaid ? "border-yellow-400 bg-yellow-100 text-yellow-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>Todos</button>
                {PAID_OPTIONS.map((s) => (
                  <button key={s} onClick={() => setFilterPaid(filterPaid === s ? "" : s)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition ${filterPaid === s ? `border-transparent ${PAID_COLORS[s]}` : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>{s}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: "Total clientes", value: filtered.length },
            { label: "Activos", value: activeCount },
            { label: "Pagados", value: paidCount },
            { label: "Facturación anual", value: clp(totalValueAnual) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-3">
              <div className="text-xs text-gray-500 mb-0.5">{label}</div>
              <div className="text-lg font-bold text-gray-900">{value}</div>
            </div>
          ))}
        </div>

        {pendingValue > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 text-sm flex items-center gap-2">
            <span className="text-yellow-600 font-semibold">Por cobrar:</span>
            <span className="font-bold text-yellow-700">{clp(pendingValue)}</span>
            <span className="text-yellow-500 text-xs">({filtered.filter((c) => (c.paid || "").toUpperCase() !== "SI").length} clientes)</span>
          </div>
        )}

        <p className="text-sm text-gray-500 mb-3">{filtered.length} clientes</p>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Cargando...</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Nombre</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Sitio Web</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Inicio</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Estado</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Pago</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Hosting/Año</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Último Pago</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Plan</th>
                  <th className="px-4 py-3 text-xs" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-16 text-gray-400">Sin registros. Agrega el primer cliente con hosting.</td></tr>
                )}
                {filtered.map((c) => {
                  const svcName = services.find(s => s.id === c.serviceId)?.name;
                  return (
                    <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{c.name}</div>
                        {c.phone && <div className="text-xs text-gray-400">{c.phone}</div>}
                        {c.location && <div className="text-xs text-gray-400">{c.location}</div>}
                      </td>
                      <td className="px-4 py-3 text-xs text-blue-600">
                        {c.website ? <a href={c.website} target="_blank" rel="noopener noreferrer" className="hover:underline">{c.website}</a> : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{c.startDate || "—"}</td>
                      <td className="px-4 py-3">
                        <select value={c.statusOp || ""} onChange={async (e) => {
                          const val = e.target.value;
                          setItems((prev) => prev.map((i) => i.id === c.id ? { ...i, statusOp: val } : i));
                          await fetch(`/api/crm/hosting/${c.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...c, statusOp: val }) });
                        }} className={`px-2 py-0.5 rounded-full text-xs font-semibold border-0 focus:outline-none cursor-pointer ${STATUS_COLORS[c.statusOp || ""] || "bg-gray-100 text-gray-600"}`}>
                          <option value="">—</option>
                          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => togglePaid(c)}
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 transition ${PAID_COLORS[(c.paid || "").toUpperCase()] || "bg-gray-100 text-gray-600"}`}>
                          {(c.paid || "").toUpperCase() === "SI" && <Check size={10} />}
                          {c.paid || "—"}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-semibold text-sm" style={{ color: "#FFC207" }}>{clp(c.hostingValue)}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{c.lastPaymentDate || "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{svcName || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={13} /></button>
                          <button onClick={() => handleDelete(c.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-50 border-t-2 border-gray-200">
                    <td colSpan={5} className="px-4 py-3 text-xs font-semibold text-gray-600">Total anual ({filtered.length} clientes)</td>
                    <td className="px-4 py-3 font-bold text-sm" style={{ color: "#FFC207" }}>{clp(totalValueAnual)}</td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">{editItem ? "Editar Cliente" : "Nuevo Cliente Hosting"}</h2>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nombre *" value={form.name as string} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
                <Field label="Teléfono" value={form.phone as string} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
              </div>
              <Field label="Sitio web" value={form.website as string} onChange={(v) => setForm((f) => ({ ...f, website: v }))} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fecha inicio" value={form.startDate as string} onChange={(v) => setForm((f) => ({ ...f, startDate: v }))} />
                <Field label="Ciudad" value={form.location as string} onChange={(v) => setForm((f) => ({ ...f, location: v }))} />
              </div>
              {/* Service selector */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Servicio de hosting</label>
                <select value={form.serviceId as string} onChange={(e) => handleServiceSelect(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400">
                  <option value="">— Sin servicio —</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name}{s.price ? ` (${new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(s.price)})` : ""}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
                  <select value={form.statusOp as string} onChange={(e) => setForm((f) => ({ ...f, statusOp: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400">
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Pagado</label>
                  <select value={form.paid as string} onChange={(e) => setForm((f) => ({ ...f, paid: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400">
                    {PAID_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Valor Hosting/Año (CLP)</label>
                  <input type="number" min="0" value={form.hostingValue as number}
                    onChange={(e) => setForm((f) => ({ ...f, hostingValue: parseFloat(e.target.value) || 0 }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Fecha último pago</label>
                  <input type="date" value={form.lastPaymentDate as string}
                    onChange={(e) => setForm((f) => ({ ...f, lastPaymentDate: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                </div>
              </div>
              <Field label="Tags (separados por coma)" value={form.tags as string} onChange={(v) => setForm((f) => ({ ...f, tags: v }))} />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm">Cancelar</button>
              <button onClick={handleSave} disabled={saving || !form.name}
                className="flex-1 py-2 rounded-lg text-sm font-semibold text-black disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ backgroundColor: "#FFC207" }}>
                {saving ? "Guardando..." : <><Check size={14} /> {editItem ? "Actualizar" : "Guardar"}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string; }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
    </div>
  );
}
