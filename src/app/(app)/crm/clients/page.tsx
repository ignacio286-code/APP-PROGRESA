"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import {
  Search, Users, Phone, Mail, Globe, FileText, Trash2,
  RefreshCw, DollarSign, Pencil, X, Save, ChevronDown,
  Building2, ExternalLink, Upload,
} from "lucide-react";

interface ProposalItem { quantity: number; unitPrice: number; discount: number; tax: number; }

interface Client {
  id: string;
  name: string;
  rut?: string;
  contactPerson?: string;
  cargo?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  website?: string;
  services?: string;
  selectedPlan?: string;
  budget?: number;
  objective?: string;
  notes?: string;
  status: string;
  startDate: string;
  proposal?: { folio?: string; items: ProposalItem[] };
}

function itemTotal(i: ProposalItem) {
  return i.quantity * i.unitPrice * (1 - i.discount / 100) * (1 + i.tax / 100);
}

function proposalTotal(items: ProposalItem[]) {
  return items.reduce((s, i) => s + itemTotal(i), 0);
}

function clp(n: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
}

const STATUS_COLORS: Record<string, string> = {
  "Activo": "bg-green-100 text-green-700",
  "Suspendido": "bg-red-100 text-red-700",
  "En Proceso": "bg-yellow-100 text-yellow-700",
  "Inactivo": "bg-gray-100 text-gray-600",
};

const PLANS = ["Básico", "Estándar", "Premium", "Enterprise", "A medida"];
const STATUSES = ["Activo", "En Proceso", "Suspendido", "Inactivo"];

function parsePdfUrl(notes?: string): string {
  if (!notes) return "";
  try {
    const parsed = JSON.parse(notes);
    return parsed.pdfUrl || "";
  } catch { return ""; }
}

function parseNotes(notes?: string): string {
  if (!notes) return "";
  try {
    const parsed = JSON.parse(notes);
    return parsed.notes || "";
  } catch { return notes; }
}

function encodeNotes(pdfUrl: string, generalNotes: string): string {
  return JSON.stringify({ pdfUrl, notes: generalNotes });
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Edit modal
  const [editing, setEditing] = useState<Client | null>(null);
  const [editForm, setEditForm] = useState<Partial<Client>>({});
  const [editPdfUrl, setEditPdfUrl] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/clients?search=${encodeURIComponent(search)}&status=${encodeURIComponent(statusFilter)}`);
      setClients(await res.json());
    } finally { setLoading(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este cliente?")) return;
    setDeleting(id);
    await fetch(`/api/crm/clients/${id}`, { method: "DELETE" });
    setClients(prev => prev.filter(c => c.id !== id));
    setDeleting(null);
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/crm/clients/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setClients(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  }

  function openEdit(client: Client) {
    setEditing(client);
    setEditForm({ ...client });
    setEditPdfUrl(parsePdfUrl(client.notes));
    setEditNotes(parseNotes(client.notes));
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    try {
      const body = {
        ...editForm,
        notes: encodeNotes(editPdfUrl, editNotes),
      };
      delete (body as Record<string, unknown>).proposal;
      delete (body as Record<string, unknown>).id;
      await fetch(`/api/crm/clients/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setClients(prev => prev.map(c =>
        c.id === editing.id ? { ...c, ...body, id: c.id, proposal: c.proposal } : c
      ));
      setEditing(null);
    } catch (err) {
      alert("Error al guardar: " + String(err));
    } finally { setSaving(false); }
  }

  const filtered = clients.filter(c => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.city || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.rut || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === "Activo").length,
    suspended: clients.filter(c => c.status === "Suspendido").length,
    totalRevenue: clients.reduce((sum, c) => sum + proposalTotal(c.proposal?.items || []), 0),
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header title="Clientes Progresa" subtitle="Clientes que aceptaron una propuesta" />
      <main className="flex-1 p-4 md:p-6">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total clientes", value: stats.total, color: "text-blue-600" },
            { label: "Activos", value: stats.active, color: "text-green-600" },
            { label: "Suspendidos", value: stats.suspended, color: "text-red-600" },
            { label: "Facturación mensual", value: clp(stats.totalRevenue), color: "text-yellow-600" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && load()}
              placeholder="Buscar por nombre, email, RUT..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400" />
          </div>
          <div className="relative">
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); }}
              className="pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 appearance-none">
              <option value="">Todos los estados</option>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <button onClick={load} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40"><RefreshCw size={24} className="animate-spin text-gray-400" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Users size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium">Sin clientes aún</p>
            <p className="text-sm text-gray-400 mt-1">Los clientes aparecen aquí cuando aceptan una propuesta.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Contacto</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Plan</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Pago Mensual</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(client => {
                  const total = proposalTotal(client.proposal?.items || []);
                  const pdfUrl = parsePdfUrl(client.notes);
                  return (
                    <tr key={client.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-xs font-bold text-yellow-700 shrink-0">
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{client.name}</p>
                            {client.rut && <p className="text-xs text-gray-400">RUT: {client.rut}</p>}
                            {client.city && <p className="text-xs text-gray-400">{client.city}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="space-y-0.5">
                          {client.contactPerson && <p className="text-sm text-gray-700 flex items-center gap-1.5"><Users size={12} className="text-gray-400" />{client.contactPerson}</p>}
                          {client.phone && <p className="text-xs text-gray-500 flex items-center gap-1.5"><Phone size={11} className="text-gray-400" />{client.phone}</p>}
                          {client.email && <p className="text-xs text-gray-500 flex items-center gap-1.5 truncate max-w-[200px]"><Mail size={11} className="text-gray-400" />{client.email}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {client.selectedPlan && (
                          <span className="text-xs px-2 py-1 rounded-full text-black font-semibold" style={{ backgroundColor: "#FFC207" }}>
                            {client.selectedPlan}
                          </span>
                        )}
                        {client.proposal?.folio && (
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <FileText size={10} />#{client.proposal.folio}
                          </p>
                        )}
                        {pdfUrl && (
                          <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline mt-1 flex items-center gap-1">
                            <ExternalLink size={10} />Ver propuesta
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {total > 0 ? (
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-gray-900">{clp(total)}</span>
                            <span className="text-xs text-gray-400">mensual</span>
                          </div>
                        ) : client.budget ? (
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-gray-900">{clp(client.budget)}</span>
                            <span className="text-xs text-gray-400">mensual</span>
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">Sin definir</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <select value={client.status} onChange={e => updateStatus(client.id, e.target.value)}
                          className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[client.status] || "bg-gray-100 text-gray-600"}`}>
                          {STATUSES.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {client.website && (
                            <a href={client.website} target="_blank" rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500">
                              <Globe size={13} />
                            </a>
                          )}
                          <button onClick={() => openEdit(client)}
                            className="p-1.5 rounded-lg hover:bg-yellow-100" style={{ backgroundColor: "#FFC20720" }}>
                            <Pencil size={13} style={{ color: "#b8860b" }} />
                          </button>
                          <button onClick={() => handleDelete(client.id)} disabled={deleting === client.id}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100">
                  <Building2 size={18} style={{ color: "#b8860b" }} />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Editar Cliente</h2>
                  <p className="text-xs text-gray-400">{editing.name}</p>
                </div>
              </div>
              <button onClick={() => setEditing(null)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre empresa *</label>
                  <input value={editForm.name || ""} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">RUT</label>
                  <input value={editForm.rut || ""} onChange={e => setEditForm(p => ({ ...p, rut: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Persona de contacto</label>
                  <input value={editForm.contactPerson || ""} onChange={e => setEditForm(p => ({ ...p, contactPerson: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Cargo</label>
                  <input value={editForm.cargo || ""} onChange={e => setEditForm(p => ({ ...p, cargo: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Teléfono</label>
                  <input value={editForm.phone || ""} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                  <input type="email" value={editForm.email || ""} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Ciudad</label>
                  <input value={editForm.city || ""} onChange={e => setEditForm(p => ({ ...p, city: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Dirección</label>
                  <input value={editForm.address || ""} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Sitio Web</label>
                  <input value={editForm.website || ""} onChange={e => setEditForm(p => ({ ...p, website: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Plan</label>
                  <select value={editForm.selectedPlan || ""} onChange={e => setEditForm(p => ({ ...p, selectedPlan: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400">
                    <option value="">Sin plan</option>
                    {PLANS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Pago mensual (CLP)</label>
                  <input type="number" value={editForm.budget || ""} onChange={e => setEditForm(p => ({ ...p, budget: Number(e.target.value) }))}
                    placeholder="Ej: 450000"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Estado</label>
                  <select value={editForm.status || "Activo"} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400">
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Servicios contratados</label>
                <textarea value={editForm.services || ""} onChange={e => setEditForm(p => ({ ...p, services: e.target.value }))}
                  rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Objetivo</label>
                <textarea value={editForm.objective || ""} onChange={e => setEditForm(p => ({ ...p, objective: e.target.value }))}
                  rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none" />
              </div>

              {/* PDF Propuesta aceptada */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <label className="block text-xs font-semibold text-blue-700 mb-2 flex items-center gap-2">
                  <Upload size={13} />
                  Propuesta aceptada (PDF)
                </label>
                <input
                  value={editPdfUrl}
                  onChange={e => setEditPdfUrl(e.target.value)}
                  placeholder="URL del PDF de la propuesta aceptada (Google Drive, Dropbox, etc.)"
                  className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {editPdfUrl && (
                  <a href={editPdfUrl} target="_blank" rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                    <ExternalLink size={12} />Ver propuesta adjunta
                  </a>
                )}
                <p className="text-xs text-blue-500 mt-2">Pega la URL compartida del PDF de la propuesta aceptada por el cliente.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Notas internas</label>
                <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)}
                  rows={3} placeholder="Notas internas del cliente..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition">
                Cancelar
              </button>
              <button onClick={saveEdit} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-black disabled:opacity-50"
                style={{ backgroundColor: "#FFC207" }}>
                {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
