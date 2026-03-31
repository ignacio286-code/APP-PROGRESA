"use client";

import { useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import {
  Search, Plus, Trash2, X, Download, Upload,
  Columns, GripVertical, RefreshCw,
} from "lucide-react";
import * as XLSX from "xlsx";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  description?: string;
  selectedPlan?: string;
  webPlan?: string;
  services?: string;
  notes?: string;
}

interface ColConfig {
  key: string;
  label: string;
  visible: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_COLUMNS: ColConfig[] = [
  { key: "name",          label: "Nombre",          visible: true  },
  { key: "contactPerson", label: "Encargado",        visible: true  },
  { key: "phone",         label: "Teléfono",         visible: true  },
  { key: "email",         label: "Email",            visible: true  },
  { key: "city",          label: "Ciudad",           visible: true  },
  { key: "status",        label: "Estado",           visible: true  },
  { key: "selectedPlan",  label: "Plan",             visible: true  },
  { key: "rut",           label: "RUT",              visible: false },
  { key: "website",       label: "Sitio Web",        visible: false },
  { key: "location",      label: "Dirección",        visible: false },
  { key: "webPlan",       label: "Plan Web",         visible: false },
  { key: "services",      label: "Servicios",        visible: true  },
  { key: "description",   label: "Descripcion",      visible: true  },
  { key: "hasSocialMedia",label: "Redes Sociales",   visible: false },
  { key: "workday",       label: "Jornada",          visible: false },
  { key: "objective",     label: "Objetivo",         visible: false },
  { key: "notes",         label: "Notas",            visible: false },
];

const STATUS_OPTS = ["Nuevo", "Contactado", "Propuesta", "Ganado", "Rechazo", "Estancado"];

const STATUS_COLORS: Record<string, string> = {
  Nuevo:      "bg-blue-100 text-blue-700",
  Contactado: "bg-yellow-100 text-yellow-700",
  Propuesta:  "bg-purple-100 text-purple-700",
  Ganado:     "bg-green-100 text-green-700",
  Rechazo:    "bg-red-100 text-red-700",
  Estancado:  "bg-gray-100 text-gray-600",
};

const STORAGE_KEY = "crm-leads-columns-v2";

const EMPTY_FORM: Omit<Lead, "id"> = {
  name: "", rut: "", website: "", contactPerson: "", phone: "", email: "",
  status: "Nuevo", location: "", city: "", hasSocialMedia: "", workday: "",
  objective: "", description: "", selectedPlan: "", webPlan: "", services: "", notes: "",
};

const FORM_LABELS: Partial<Record<keyof Omit<Lead, "id">, string>> = {
  name: "Nombre *", contactPerson: "Encargado", phone: "Teléfono", email: "Email",
  city: "Ciudad", status: "Estado", selectedPlan: "Plan Seleccionado", rut: "RUT",
  website: "Sitio Web", location: "Dirección", services: "Servicios",
  description: "Descripción", objective: "Objetivo", notes: "Notas",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [form, setForm] = useState<Omit<Lead, "id">>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [syncingMonday, setSyncingMonday] = useState(false);
  const [showColPanel, setShowColPanel] = useState(false);
  const [columns, setColumns] = useState<ColConfig[]>(DEFAULT_COLUMNS);
  const [editing, setEditing] = useState<{ id: string; key: string; value: string } | null>(null);
  const [dragColIdx, setDragColIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const colPanelRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Load columns from localStorage (client-only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: ColConfig[] = JSON.parse(stored);
        const existingKeys = new Set(parsed.map((c) => c.key));
        const merged = [
          ...parsed,
          ...DEFAULT_COLUMNS.filter((d) => !existingKeys.has(d.key)),
        ];
        setColumns(merged);
      }
    } catch {}
  }, []);

  function persistColumns(updated: ColConfig[]) {
    setColumns(updated);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
  }

  // Close panel on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (colPanelRef.current && !colPanelRef.current.contains(e.target as Node)) {
        setShowColPanel(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // ── Data fetching ──────────────────────────────────────────────────────────

  async function fetchLeads() {
    setLoading(true);
    const res = await fetch(`/api/crm/leads?search=${encodeURIComponent(search)}`);
    setLeads(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchLeads(); }, []); // eslint-disable-line

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este registro?")) return;
    await fetch(`/api/crm/leads/${id}`, { method: "DELETE" });
    setLeads((prev) => prev.filter((l) => l.id !== id));
  }

  function openCreate() {
    setEditLead(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(lead: Lead) {
    setEditLead(lead);
    const { id, ...rest } = lead; void id;
    setForm(rest as Omit<Lead, "id">);
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    if (editLead) {
      const res = await fetch(`/api/crm/leads/${editLead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const updated = await res.json();
      setLeads((prev) => prev.map((l) => l.id === editLead.id ? updated : l));
    } else {
      await fetch("/api/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      fetchLeads();
    }
    setSaving(false);
    setShowModal(false);
  }

  // ── Inline cell editing ────────────────────────────────────────────────────

  async function commitEdit() {
    if (!editing) return;
    const { id, key, value } = editing;
    setEditing(null);
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, [key]: value } : l)));
    await fetch(`/api/crm/leads/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
  }

  function startEdit(lead: Lead, key: string) {
    setEditing({ id: lead.id, key, value: (lead[key as keyof Lead] as string) || "" });
    setTimeout(() => editInputRef.current?.focus(), 0);
  }

  // ── Status inline change ───────────────────────────────────────────────────

  async function changeStatus(id: string, status: string) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    await fetch(`/api/crm/leads/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  // ── Monday sync ────────────────────────────────────────────────────────────

  async function handleSyncMonday() {
    setSyncingMonday(true);
    try {
      const res = await fetch("/api/crm/import", { method: "POST" });
      const data = await res.json();
      if (data.ok) alert(`Sincronización completada.\nLeads: ${data.imported.leads}`);
      else alert("Error: " + (data.error || "desconocido"));
      fetchLeads();
    } catch {
      alert("Error de red al sincronizar.");
    }
    setSyncingMonday(false);
  }

  // ── Excel export / import ──────────────────────────────────────────────────

  function handleExport() {
    const activeCols = columns.filter((c) => c.visible);
    const rows = filtered.map((l) =>
      Object.fromEntries(activeCols.map(({ key, label }) => [label, l[key as keyof Lead] || ""]))
    );
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clientes Potenciales");
    XLSX.writeFile(wb, "clientes_potenciales.xlsx");
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws);
    const labelToKey = Object.fromEntries(DEFAULT_COLUMNS.map(({ key, label }) => [label, key]));
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
    alert(`${ok} registros importados.`);
    fetchLeads();
  }

  // ── Column config drag-and-drop ────────────────────────────────────────────

  function onColDragStart(idx: number) { setDragColIdx(idx); }
  function onColDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragColIdx === null || dragColIdx === idx) return;
    setDragOverIdx(idx);
    const updated = [...columns];
    const [moved] = updated.splice(dragColIdx, 1);
    updated.splice(idx, 0, moved);
    setDragColIdx(idx);
    setColumns(updated);
  }
  function onColDragEnd() {
    setDragColIdx(null);
    setDragOverIdx(null);
    persistColumns(columns);
  }

  // ── Filtered data ──────────────────────────────────────────────────────────

  const filtered = leads.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.city || "").toLowerCase().includes(search.toLowerCase())
  );

  const activeColumns = columns.filter((c) => c.visible);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header title="Clientes Potenciales" />
      <main className="flex-1 p-6 w-full overflow-x-auto">

        {/* ── Toolbar ── */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchLeads()}
              placeholder="Buscar..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          {/* Monday sync */}
          <button
            onClick={handleSyncMonday}
            disabled={syncingMonday}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm hover:bg-gray-50 disabled:opacity-60 transition"
          >
            <RefreshCw size={15} className={syncingMonday ? "animate-spin" : ""} />
            {syncingMonday ? "Sincronizando..." : "Sincronizar Monday"}
          </button>

          {/* Excel */}
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

          {/* Columns config */}
          <div className="relative" ref={colPanelRef}>
            <button
              onClick={() => setShowColPanel((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition ${
                showColPanel
                  ? "border-yellow-400 bg-yellow-50 text-yellow-700"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Columns size={15} /> Columnas
            </button>

            {showColPanel && (
              <div className="absolute right-0 top-11 w-60 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-800">Columnas visibles</span>
                  <button
                    onClick={() => persistColumns(DEFAULT_COLUMNS)}
                    className="text-xs text-gray-400 hover:text-gray-700 transition"
                  >
                    Restablecer
                  </button>
                </div>
                <p className="text-xs text-gray-400 mb-2">Arrastra para reordenar</p>
                <div className="space-y-0.5 max-h-72 overflow-y-auto">
                  {columns.map((col, idx) => (
                    <div
                      key={col.key}
                      draggable
                      onDragStart={() => onColDragStart(idx)}
                      onDragOver={(e) => onColDragOver(e, idx)}
                      onDragEnd={onColDragEnd}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg select-none transition ${
                        dragOverIdx === idx ? "bg-yellow-50" : "hover:bg-gray-50"
                      }`}
                      style={{ cursor: "grab" }}
                    >
                      <GripVertical size={14} className="text-gray-300 flex-shrink-0" />
                      <input
                        type="checkbox"
                        checked={col.visible}
                        onChange={() =>
                          persistColumns(
                            columns.map((c) => (c.key === col.key ? { ...c, visible: !c.visible } : c))
                          )
                        }
                        className="accent-yellow-400"
                      />
                      <span className="text-sm text-gray-700">{col.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* New lead */}
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-black ml-auto"
            style={{ backgroundColor: "#FFC207" }}
          >
            <Plus size={16} /> Nuevo Lead
          </button>
        </div>

        <p className="text-xs text-gray-400 mb-3">{filtered.length} registros</p>

        {/* ── Table ── */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Cargando...</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
            <table className="text-sm" style={{ minWidth: "100%", tableLayout: "auto" }}>
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {activeColumns.map((col) => (
                    <th
                      key={col.key}
                      className="text-left px-3 py-3 font-semibold text-gray-600 whitespace-nowrap text-xs uppercase tracking-wide"
                    >
                      {col.label}
                    </th>
                  ))}
                  <th className="px-3 py-3 w-16" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={activeColumns.length + 1} className="text-center py-16 text-gray-400">
                      Sin registros. Sincroniza desde Monday o importa un Excel.
                    </td>
                  </tr>
                )}
                {filtered.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-gray-100 hover:bg-gray-50/50 transition group"
                  >
                    {activeColumns.map((col) => (
                      <td
                        key={col.key}
                        className="px-3 py-2"
                        onClick={() => col.key !== "status" && startEdit(lead, col.key)}
                      >
                        {editing?.id === lead.id && editing?.key === col.key ? (
                          <input
                            ref={editInputRef}
                            value={editing.value}
                            onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                            onBlur={commitEdit}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitEdit();
                              if (e.key === "Escape") setEditing(null);
                            }}
                            className="w-full min-w-[80px] border border-yellow-400 rounded px-2 py-0.5 text-sm focus:outline-none bg-yellow-50"
                          />
                        ) : col.key === "status" ? (
                          <select
                            value={lead.status || ""}
                            onChange={(e) => changeStatus(lead.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className={`px-2 py-0.5 rounded-full text-xs font-medium border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-yellow-400 ${
                              STATUS_COLORS[lead.status || ""] || "bg-gray-100 text-gray-600"
                            }`}
                          >
                            <option value="">—</option>
                            {STATUS_OPTS.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className="block cursor-text rounded px-1 -mx-1 min-h-[22px] min-w-[50px] hover:bg-yellow-50 transition"
                            title="Clic para editar"
                          >
                            {(lead[col.key as keyof Lead] as string) || (
                              <span className="text-gray-300 text-xs">—</span>
                            )}
                          </span>
                        )}
                      </td>
                    ))}
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition justify-end">
                        <button
                          onClick={() => openEdit(lead)}
                          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                          title="Editar en modal"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 1-2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(lead.id)}
                          className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                          title="Eliminar"
                        >
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

        {/* ── Modal crear / editar ── */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold">
                  {editLead ? "Editar Lead" : "Nuevo Lead"}
                </h2>
                <button onClick={() => setShowModal(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3">
                {(Object.keys(FORM_LABELS) as Array<keyof typeof FORM_LABELS>).map((field) => (
                  <div key={field}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {FORM_LABELS[field]}
                    </label>
                    {field === "status" ? (
                      <select
                        value={form[field] || ""}
                        onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      >
                        <option value="">—</option>
                        {STATUS_OPTS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : field === "notes" || field === "objective" || field === "description" ? (
                      <textarea
                        value={(form[field] as string) || ""}
                        onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
                        rows={3}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                      />
                    ) : (
                      <input
                        value={(form[field] as string) || ""}
                        onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      />
                    )}
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
