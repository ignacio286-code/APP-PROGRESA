"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import {
  Search, Plus, Trash2, X, ChevronDown, ChevronRight,
  FileText, Filter, Download, Upload, Edit2, Check, User, Package, RefreshCw, Send
} from "lucide-react";
import * as XLSX from "xlsx";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProposalItem {
  id: string;
  name: string;
  description?: string;
  serviceId?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  order: number;
}

interface Proposal {
  id: string;
  folio?: string;
  name: string;
  clientRut?: string;
  clientAddress?: string;
  clientPhone?: string;
  clientEmail?: string;
  status: string;
  issueDate: string;
  dueDate?: string;
  sentAt?: string;
  acceptedAt?: string;
  leadId?: string;
  agentName?: string;
  agentPhone?: string;
  agentEmail?: string;
  termsConditions?: string;
  notes?: string;
  lostReason?: string;
  items: ProposalItem[];
}

interface Lead {
  id: string;
  name: string;
  rut?: string;
  location?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  contactPerson?: string;
}

interface Service {
  id: string;
  name: string;
  description?: string;
  price?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUSES = ["Pendiente", "Enviado", "Estancado", "Ganado", "Perdido"];

const STATUS_COLORS: Record<string, string> = {
  Ganado:    "bg-green-100 text-green-700",
  Perdido:   "bg-red-100 text-red-700",
  Estancado: "bg-yellow-100 text-yellow-700",
  Enviado:   "bg-blue-100 text-blue-700",
  Pendiente: "bg-gray-100 text-gray-600",
};

const DEFAULT_TERMS = `Términos y Condiciones:
- Trabajo sujeto a un contrato por 6 meses renovables automáticamente por el mismo periodo. En caso de querer dar término al contrato, se debe avisar con 30 días de anticipación, vía correo electrónico, para servicio de Redes Sociales, SEO y SEM.
- En cuanto al desarrollo de Páginas Web, el proceso es de 1 a 2 meses, y el tiempo corre cuando nos envían toda la información. Una vez mostrado el avance final, tiene sólo una instancia para realizar todas las modificaciones que se requieran en base a la información enviada. Toda modificación adicional a la solicitada tendrá un costo extra.
- Condiciones de Pago: El caso de servicios de SEO, SEM y Redes Sociales, se cancela al momento de comenzar el proyecto. En caso de Desarrollo de páginas web se cancela 50% por concepto de anticipo y el otro 50% se cancela al momento de la entrega del proyecto.
- Los canales de comunicación son por correo o por grupo WhatsApp, se generan 1-3 reuniones mensuales. Informes se entregan luego de 30 días.
- Horario de atención: 9:00 - 19:00`;

const EMPTY_ITEM = (): ProposalItem => ({
  id: crypto.randomUUID(),
  name: "",
  description: "",
  serviceId: "",
  quantity: 1,
  unitPrice: 0,
  discount: 0,
  tax: 0,
  order: 0,
});

const EMPTY_FORM = (): Omit<Proposal, "id" | "folio"> => ({
  name: "",
  clientRut: "",
  clientAddress: "",
  clientPhone: "",
  clientEmail: "",
  status: "Pendiente",
  issueDate: new Date().toISOString().slice(0, 10),
  dueDate: "",
  agentName: "Ignacio Gómez Díaz",
  agentPhone: "999437664",
  agentEmail: "ignacio.gomez286@gmail.com",
  termsConditions: DEFAULT_TERMS,
  notes: "",
  items: [EMPTY_ITEM()],
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clp(n: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency", currency: "CLP", maximumFractionDigits: 0,
  }).format(n);
}

function itemTotal(item: ProposalItem) {
  const base = item.quantity * item.unitPrice;
  const afterDiscount = base * (1 - item.discount / 100);
  return afterDiscount * (1 + item.tax / 100);
}

function proposalNetTotal(items: ProposalItem[]) {
  return items.reduce((sum, i) => sum + itemTotal(i), 0);
}

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-CL");
}

// ─── Searchable dropdown hook ─────────────────────────────────────────────────

function useDropdown() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return { open, setOpen, query, setQuery, ref };
}

// ─── Lead Picker ──────────────────────────────────────────────────────────────

function LeadPicker({
  leads,
  selectedName,
  onSelect,
  onClear,
}: {
  leads: Lead[];
  selectedName: string;
  onSelect: (lead: Lead) => void;
  onClear: () => void;
}) {
  const { open, setOpen, query, setQuery, ref } = useDropdown();

  const filtered = leads.filter((l) =>
    l.name.toLowerCase().includes(query.toLowerCase()) ||
    (l.rut || "").toLowerCase().includes(query.toLowerCase()) ||
    (l.city || "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-medium text-gray-500 mb-1">
        Buscar cliente potencial
      </label>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={selectedName && !open ? selectedName : query}
          onFocus={() => { setOpen(true); setQuery(""); }}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          placeholder="Escribe nombre, RUT o ciudad..."
          className="w-full pl-8 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        {selectedName && !open && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClear(); setQuery(""); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-full bg-white rounded-xl shadow-2xl border border-gray-200 z-30 max-h-56 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-xs text-gray-400">
              {leads.length === 0
                ? "No hay clientes potenciales. Agrégalos en CRM → Clientes Potenciales."
                : "Sin coincidencias"}
            </div>
          ) : (
            filtered.map((l) => (
              <button
                key={l.id}
                type="button"
                onMouseDown={() => { onSelect(l); setOpen(false); setQuery(""); }}
                className="w-full text-left px-4 py-2.5 hover:bg-yellow-50 border-b border-gray-100 last:border-0 flex items-start gap-3"
              >
                <div className="w-7 h-7 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User size={13} style={{ color: "#FFC207" }} />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{l.name}</div>
                  <div className="text-xs text-gray-400 flex gap-2 flex-wrap mt-0.5">
                    {l.rut && <span>RUT: {l.rut}</span>}
                    {l.city && <span>{l.city}</span>}
                    {l.phone && <span>{l.phone}</span>}
                    {l.email && <span>{l.email}</span>}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Service Picker for a single row ─────────────────────────────────────────

function ServiceCell({
  item,
  services,
  onPick,
  onUpdate,
}: {
  item: ProposalItem;
  services: Service[];
  onPick: (svc: Service) => void;
  onUpdate: (field: string, value: string) => void;
}) {
  const { open, setOpen, query, setQuery, ref } = useDropdown();

  const filtered = services.filter((s) =>
    s.name.toLowerCase().includes((open ? query : item.name).toLowerCase())
  );

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Package size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-300" />
        <input
          value={open ? query : item.name}
          onFocus={() => { setOpen(true); setQuery(item.name); }}
          onChange={(e) => { setQuery(e.target.value); onUpdate("name", e.target.value); setOpen(true); }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Nombre servicio"
          className="w-full pl-6 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute left-0 top-full mt-1 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-30 max-h-48 overflow-y-auto">
          {filtered.map((s) => (
            <button
              key={s.id}
              type="button"
              onMouseDown={() => { onPick(s); setOpen(false); }}
              className="w-full text-left px-3 py-2 hover:bg-yellow-50 border-b border-gray-100 last:border-0"
            >
              <div className="font-medium text-gray-900 text-xs">{s.name}</div>
              {s.description && (
                <div className="text-gray-400 text-xs truncate">{s.description}</div>
              )}
              {s.price != null && (
                <div className="text-xs font-semibold mt-0.5" style={{ color: "#FFC207" }}>{clp(s.price)}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] || "bg-gray-100 text-gray-600";
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{status}</span>;
}

// ─── Totals Bar ───────────────────────────────────────────────────────────────

function TotalsBar({ proposals }: { proposals: Proposal[] }) {
  const byStatus = STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = proposals.filter((p) => p.status === s).reduce((sum, p) => sum + proposalNetTotal(p.items), 0);
    return acc;
  }, {});
  const total = proposals.reduce((sum, p) => sum + proposalNetTotal(p.items), 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-4 items-center text-sm">
      <div className="font-bold text-gray-900">Total: <span style={{ color: "#FFC207" }}>{clp(total)}</span></div>
      {STATUSES.map((s) => byStatus[s] > 0 && (
        <div key={s} className="flex items-center gap-1">
          <StatusBadge status={s} />
          <span className="text-gray-700 font-medium">{clp(byStatus[s])}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = [
  { key: "", label: "Todas" },
  { key: "Ganado", label: "Ganadas" },
  { key: "Perdido", label: "Perdidas" },
  { key: "Estancado", label: "Estancadas" },
];

import { Suspense } from "react";

function ProposalsContent() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Proposal[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM());
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [saving, setSaving] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [syncingMonday, setSyncingMonday] = useState(false);
  // Lost reason modal
  const [lostModal, setLostModal] = useState<{ id: string } | null>(null);
  const [lostReason, setLostReason] = useState("");
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/crm/proposals?${params}`);
    setItems(await res.json());
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchProposals(); }, [fetchProposals]);

  useEffect(() => {
    fetch("/api/crm/services").then((r) => r.json()).then(setServices);
    fetch("/api/crm/leads").then((r) => r.json()).then((data) => {
      setLeads(data);
      // Auto-open modal if leadId param present
      const leadId = searchParams.get("leadId");
      if (leadId) {
        const lead = data.find((l: Lead) => l.id === leadId);
        if (lead) {
          setEditId(null);
          setSelectedLead(lead);
          setForm(f => ({
            ...EMPTY_FORM(),
            name: lead.name,
            clientRut: lead.rut || "",
            clientAddress: [lead.location, lead.city].filter(Boolean).join(", "),
            clientPhone: lead.phone || "",
            clientEmail: lead.email || "",
          }));
          setShowModal(true);
        }
      }
    });
  }, [searchParams]);

  // ─── Lead selection ───────────────────────────────────────────────────────

  function handleSelectLead(lead: Lead) {
    setSelectedLead(lead);
    setForm((f) => ({
      ...f,
      name: lead.name,
      clientRut: lead.rut || f.clientRut,
      clientAddress: [lead.location, lead.city].filter(Boolean).join(", ") || f.clientAddress,
      clientPhone: lead.phone || f.clientPhone,
      clientEmail: lead.email || f.clientEmail,
    }));
  }

  function handleClearLead() {
    setSelectedLead(null);
    setForm((f) => ({
      ...f, name: "", clientRut: "", clientAddress: "", clientPhone: "", clientEmail: "",
    }));
  }

  // ─── Modal open ───────────────────────────────────────────────────────────

  function openCreate() {
    setEditId(null);
    setSelectedLead(null);
    setForm(EMPTY_FORM());
    setShowModal(true);
  }

  function openEdit(p: Proposal) {
    setEditId(p.id);
    setSelectedLead(null);
    setForm({
      name: p.name,
      clientRut: p.clientRut || "",
      clientAddress: p.clientAddress || "",
      clientPhone: p.clientPhone || "",
      clientEmail: p.clientEmail || "",
      status: p.status,
      issueDate: p.issueDate ? p.issueDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
      dueDate: p.dueDate ? p.dueDate.slice(0, 10) : "",
      agentName: p.agentName || "",
      agentPhone: p.agentPhone || "",
      agentEmail: p.agentEmail || "",
      termsConditions: p.termsConditions || DEFAULT_TERMS,
      notes: p.notes || "",
      items: p.items.length ? p.items : [EMPTY_ITEM()],
    });
    setShowModal(true);
  }

  // ─── Save ─────────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true);
    const payload = {
      ...form,
      dueDate: form.dueDate || null,
      items: form.items.filter((i) => i.name.trim()),
    };
    const url = editId ? `/api/crm/proposals/${editId}` : "/api/crm/proposals";
    const method = editId ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    setShowModal(false);
    fetchProposals();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta propuesta?")) return;
    await fetch(`/api/crm/proposals/${id}`, { method: "DELETE" });
    setItems((p) => p.filter((i) => i.id !== id));
  }

  async function handleSendProposal(p: Proposal) {
    const email = p.clientEmail;
    if (!email) {
      alert("Esta propuesta no tiene email de cliente. Edítala primero.");
      return;
    }
    if (!confirm(`¿Enviar propuesta #${p.folio || "S/N"} a ${email}?\nTambién se enviará copia a contacto@agenciaprogresa.cl`)) return;
    try {
      const res = await fetch(`/api/crm/proposals/${p.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.ok) {
        alert(`✓ Propuesta enviada a ${email}`);
        fetchItems();
      } else {
        alert("Error: " + (data.error || "No se pudo enviar"));
      }
    } catch {
      alert("Error de conexión al enviar la propuesta");
    }
  }

  async function updateStatus(id: string, status: string) {
    if (status === "Perdido") {
      setLostReason("");
      setLostModal({ id });
      return;
    }
    await fetch(`/api/crm/proposals/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setItems((prev) => prev.map((p) => p.id === id ? { ...p, status } : p));
    if (status === "Ganado") {
      await fetch(`/api/crm/proposals/${id}/accept`, { method: "POST" });
    }
  }

  async function confirmLost() {
    if (!lostModal) return;
    await fetch(`/api/crm/proposals/${lostModal.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Perdido", lostReason }),
    });
    setItems((prev) => prev.map((p) => p.id === lostModal.id ? { ...p, status: "Perdido", lostReason } : p));
    setLostModal(null);
  }

  // ─── Items ────────────────────────────────────────────────────────────────

  function addItem() {
    setForm((f) => ({ ...f, items: [...f.items, EMPTY_ITEM()] }));
  }

  function updateItem(idx: number, field: string, value: string | number) {
    setForm((f) => {
      const its = [...f.items];
      its[idx] = { ...its[idx], [field]: value };
      return { ...f, items: its };
    });
  }

  function removeItem(idx: number) {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  }

  function pickService(idx: number, svc: Service) {
    setForm((f) => {
      const its = [...f.items];
      its[idx] = {
        ...its[idx],
        serviceId: svc.id,
        name: svc.name,
        description: svc.description || "",
        unitPrice: svc.price || 0,
      };
      return { ...f, items: its };
    });
  }

  const formTotal = form.items.reduce((sum, i) => sum + itemTotal(i), 0);

  async function handleSyncMonday() {
    setSyncingMonday(true);
    try {
      const res = await fetch("/api/crm/import", { method: "POST" });
      const data = await res.json();
      if (data.ok) alert(`Sincronización completada.\nPropuestas importadas: ${data.imported.proposals}`);
      else alert("Error: " + (data.error || "desconocido"));
      fetchProposals();
    } catch {
      alert("Error de red al sincronizar.");
    }
    setSyncingMonday(false);
  }

  // ── Excel export / import ──────────────────────────────────────────────────

  const EXPORT_COLUMNS: { key: string; label: string }[] = [
    { key: "folio", label: "Folio" },
    { key: "name", label: "Nombre" },
    { key: "clientRut", label: "RUT Cliente" },
    { key: "clientEmail", label: "Email" },
    { key: "clientPhone", label: "Telefono" },
    { key: "status", label: "Estado" },
    { key: "issueDate", label: "Fecha Emision" },
    { key: "_total", label: "Total" },
  ];

  function handleExport() {
    const rows = visibleItems.map((p) => {
      const row: Record<string, string | number> = {};
      for (const col of EXPORT_COLUMNS) {
        if (col.key === "_total") {
          row[col.label] = proposalNetTotal(p.items);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          row[col.label] = ((p as unknown) as Record<string, unknown>)[col.key] as string || "";
        }
      }
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Propuestas");
    XLSX.writeFile(wb, "propuestas.xlsx");
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws);
    const labelToKey = Object.fromEntries(
      EXPORT_COLUMNS.filter((c) => c.key !== "_total").map(({ key, label }) => [label, key])
    );
    let ok = 0;
    for (const row of rows) {
      const data: Record<string, string> = {};
      for (const [label, value] of Object.entries(row)) {
        const key = labelToKey[label];
        if (key) data[key] = String(value);
      }
      if (!data.name) continue;
      if (!data.status) data.status = "Pendiente";
      if (!data.issueDate) data.issueDate = new Date().toISOString().slice(0, 10);
      await fetch("/api/crm/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      ok++;
    }
    setImporting(false);
    if (fileRef.current) fileRef.current.value = "";
    alert(`${ok} propuestas importadas.`);
    fetchProposals();
  }

  // Compute tab counts
  const tabCounts = {
    "": items.length,
    "Ganado": items.filter(p => p.status === "Ganado").length,
    "Perdido": items.filter(p => p.status === "Perdido").length,
    "Estancado": items.filter(p => p.status === "Estancado").length,
  };

  const visibleItems = items.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchTab = !activeTab || p.status === activeTab;
    return matchSearch && matchTab;
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header title="Propuestas Comerciales" />

      {/* Lost reason modal */}
      {lostModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-gray-900 text-lg mb-1">¿Por qué se perdió?</h3>
            <p className="text-sm text-gray-500 mb-4">Indica la razón para llevar un mejor seguimiento.</p>
            <textarea
              value={lostReason}
              onChange={e => setLostReason(e.target.value)}
              rows={4}
              placeholder="Ej: Precio muy alto, eligió otra agencia, sin presupuesto..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setLostModal(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={confirmLost} className="px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600">
                Confirmar perdida
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-4 bg-white border border-gray-200 rounded-xl p-1 w-fit flex-wrap">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeTab === tab.key
                  ? "bg-black text-white"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === tab.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
              }`}>
                {tabCounts[tab.key as keyof typeof tabCounts] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar empresa o cliente..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
          <button
            onClick={handleSyncMonday}
            disabled={syncingMonday}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm hover:bg-gray-50 disabled:opacity-60 transition"
          >
            <RefreshCw size={15} className={syncingMonday ? "animate-spin" : ""} />
            {syncingMonday ? "Sincronizando..." : "Sincronizar Monday"}
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
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-black"
            style={{ backgroundColor: "#FFC207" }}
          >
            <Plus size={16} /> Nueva Propuesta
          </button>
        </div>

        {items.length > 0 && <TotalsBar proposals={items} />}
        <p className="text-sm text-gray-500 mb-3">{visibleItems.length} propuesta{visibleItems.length !== 1 ? "s" : ""}</p>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Cargando...</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="grid text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-200 px-4 py-2"
              style={{ gridTemplateColumns: "2rem 1fr 7rem 8rem 7rem 8rem 8rem 6rem 6rem 5rem" }}>
              <div /><div>Propuesta</div><div>Folio</div><div>Estado</div>
              <div>Emisión</div><div>Vencimiento</div><div>Total</div><div>Items</div><div /><div />
            </div>

            {visibleItems.length === 0 && (
              <div className="text-center py-16 text-gray-400">Sin propuestas en esta categoría.</div>
            )}

            {visibleItems.map((p) => {
              const total = proposalNetTotal(p.items);
              const exp = expanded[p.id];
              return (
                <div key={p.id} className="border-b border-gray-100 last:border-0">
                  <div
                    className="grid items-center px-4 py-3 hover:bg-gray-50 cursor-pointer"
                    style={{ gridTemplateColumns: "2rem 1fr 7rem 8rem 7rem 8rem 8rem 6rem 6rem 5rem" }}
                    onClick={() => setExpanded((e) => ({ ...e, [p.id]: !e[p.id] }))}
                  >
                    <button className="text-gray-400 hover:text-gray-700 p-0.5">
                      {exp ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                    </button>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{p.name}</div>
                      {p.clientRut && <div className="text-xs text-gray-400">RUT: {p.clientRut}</div>}
                      {p.clientEmail && <div className="text-xs text-gray-400">{p.clientEmail}</div>}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">{p.folio || "—"}</div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <select
                        value={p.status}
                        onChange={(e) => updateStatus(p.id, e.target.value)}
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold border-0 focus:outline-none cursor-pointer ${STATUS_COLORS[p.status] || "bg-gray-100 text-gray-600"}`}
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="text-xs text-gray-600">{fmtDate(p.issueDate)}</div>
                    <div className="text-xs text-gray-600">{fmtDate(p.dueDate)}</div>
                    <div className="text-sm font-bold" style={{ color: "#FFC207" }}>{clp(total)}</div>
                    <div className="text-xs text-gray-400">{p.items.length} servicio{p.items.length !== 1 ? "s" : ""}</div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => handleSendProposal(p)} title="Enviar por email" className="p-1.5 rounded-lg text-gray-400 hover:text-yellow-600 hover:bg-yellow-50"><Send size={14} /></button>
                      <button onClick={() => openEdit(p)} title="Editar" className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50"><Edit2 size={14} /></button>
                      <button onClick={() => window.open(`/crm/proposals/${p.id}/print`, "_blank")} title="Ver PDF" className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50"><Download size={14} /></button>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => handleDelete(p.id)} title="Eliminar" className="p-1.5 rounded-lg text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </div>

                  {exp && p.items.length > 0 && (
                    <div className="bg-gray-50 border-t border-gray-100 px-4 pb-3">
                      <div className="grid text-xs font-semibold text-gray-400 pt-2 pb-1"
                        style={{ gridTemplateColumns: "2rem 1.5fr 3fr 4rem 7rem 5rem 5rem 7rem" }}>
                        <div /><div>Servicio</div><div>Descripción</div><div>Cant.</div>
                        <div>Precio Neto</div><div>Dcto %</div><div>IVA %</div><div>Total</div>
                      </div>
                      {p.items.map((item, idx) => (
                        <div key={item.id}
                          className={`grid items-center text-xs py-1.5 ${idx < p.items.length - 1 ? "border-b border-gray-200" : ""}`}
                          style={{ gridTemplateColumns: "2rem 1.5fr 3fr 4rem 7rem 5rem 5rem 7rem" }}>
                          <div className="text-gray-300 text-center">{idx + 1}</div>
                          <div className="font-medium text-gray-800 truncate pr-2">{item.name}</div>
                          <div className="text-gray-500 truncate pr-2">{item.description || "—"}</div>
                          <div className="text-gray-700">{item.quantity}</div>
                          <div className="text-gray-700">{clp(item.unitPrice)}</div>
                          <div className="text-gray-700">{item.discount}%</div>
                          <div className="text-gray-700">{item.tax}%</div>
                          <div className="font-semibold text-gray-900">{clp(itemTotal(item))}</div>
                        </div>
                      ))}
                      <div className="flex justify-end pt-2 border-t border-gray-200 mt-1">
                        <span className="text-xs font-bold text-gray-700">Total: <span style={{ color: "#FFC207" }}>{clp(total)}</span></span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ─── Modal ───────────────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl my-4 shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <FileText size={20} style={{ color: "#FFC207" }} />
                <h2 className="text-lg font-bold text-gray-900">
                  {editId ? "Editar Propuesta" : "Nueva Propuesta Comercial"}
                </h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-6">

              {/* ── 1. Cliente ── */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Num n={1} /> Datos del Cliente
                </h3>

                {/* Lead search */}
                <div className="mb-3">
                  <LeadPicker
                    leads={leads}
                    selectedName={selectedLead?.name || ""}
                    onSelect={handleSelectLead}
                    onClear={handleClearLead}
                  />
                </div>

                {/* Selected lead card */}
                {selectedLead && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-3 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-200 flex items-center justify-center flex-shrink-0">
                      <User size={14} style={{ color: "#000" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm">{selectedLead.name}</div>
                      <div className="text-xs text-gray-500 flex flex-wrap gap-x-3 mt-0.5">
                        {selectedLead.rut && <span>RUT: {selectedLead.rut}</span>}
                        {selectedLead.city && <span>{selectedLead.city}</span>}
                        {selectedLead.phone && <span>{selectedLead.phone}</span>}
                        {selectedLead.email && <span>{selectedLead.email}</span>}
                      </div>
                    </div>
                    <span className="text-xs text-green-600 font-semibold flex items-center gap-1 flex-shrink-0">
                      <Check size={12} /> Datos cargados
                    </span>
                  </div>
                )}

                {/* Editable fields (pre-filled or manual) */}
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Empresa / Nombre *" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
                  <Field label="RUT" value={form.clientRut || ""} onChange={(v) => setForm((f) => ({ ...f, clientRut: v }))} />
                  <Field label="Dirección" value={form.clientAddress || ""} onChange={(v) => setForm((f) => ({ ...f, clientAddress: v }))} />
                  <Field label="Teléfono" value={form.clientPhone || ""} onChange={(v) => setForm((f) => ({ ...f, clientPhone: v }))} />
                  <Field label="Email" type="email" value={form.clientEmail || ""} onChange={(v) => setForm((f) => ({ ...f, clientEmail: v }))} />
                </div>
              </section>

              {/* ── 2. Propuesta ── */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Num n={2} /> Datos de la Propuesta
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <Field label="Fecha Emisión" type="date" value={form.issueDate} onChange={(v) => setForm((f) => ({ ...f, issueDate: v }))} />
                  <Field label="Fecha Vencimiento" type="date" value={form.dueDate || ""} onChange={(v) => setForm((f) => ({ ...f, dueDate: v }))} />
                </div>
              </section>

              {/* ── 3. Ejecutivo ── */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Num n={3} /> Ejecutivo Comercial
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Nombre" value={form.agentName || ""} onChange={(v) => setForm((f) => ({ ...f, agentName: v }))} />
                  <Field label="Teléfono" value={form.agentPhone || ""} onChange={(v) => setForm((f) => ({ ...f, agentPhone: v }))} />
                  <Field label="Email" type="email" value={form.agentEmail || ""} onChange={(v) => setForm((f) => ({ ...f, agentEmail: v }))} />
                </div>
              </section>

              {/* ── 4. Servicios ── */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Num n={4} /> Servicios / Productos
                  <span className="text-xs font-normal text-gray-400 ml-1">— busca del catálogo o escribe libremente</span>
                </h3>

                <div className="rounded-xl border border-gray-200 overflow-visible">
                  <div className="grid text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-200 px-3 py-2"
                    style={{ gridTemplateColumns: "2fr 2fr 4rem 8rem 5rem 5rem 1.5rem" }}>
                    <div>Servicio</div><div>Descripción</div><div>Cant.</div>
                    <div>Precio (CLP)</div><div>Dcto %</div><div>IVA %</div><div />
                  </div>

                  {form.items.map((item, idx) => (
                    <div key={item.id}
                      className="grid items-center px-3 py-2 gap-1 border-b border-gray-100 last:border-0 overflow-visible"
                      style={{ gridTemplateColumns: "2fr 2fr 4rem 8rem 5rem 5rem 1.5rem" }}>
                      <ServiceCell
                        item={item}
                        services={services}
                        onPick={(svc) => pickService(idx, svc)}
                        onUpdate={(field, value) => updateItem(idx, field, value)}
                      />
                      <input
                        value={item.description || ""}
                        onChange={(e) => updateItem(idx, "description", e.target.value)}
                        placeholder="Descripción"
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      />
                      <input
                        type="number" min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-400 text-center"
                      />
                      <input
                        type="number" min="0"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value))}
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-400 text-right"
                      />
                      <input
                        type="number" min="0" max="100"
                        value={item.discount}
                        onChange={(e) => updateItem(idx, "discount", Number(e.target.value))}
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-400 text-center"
                      />
                      <input
                        type="number" min="0" max="100"
                        value={item.tax}
                        onChange={(e) => updateItem(idx, "tax", Number(e.target.value))}
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-400 text-center"
                      />
                      <button
                        onClick={() => removeItem(idx)}
                        disabled={form.items.length === 1}
                        className="text-gray-300 hover:text-red-500 disabled:opacity-30 p-0.5"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-2">
                  <button
                    onClick={addItem}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 px-2 py-1 rounded-lg hover:bg-gray-100 transition"
                  >
                    <Plus size={13} /> Agregar servicio
                  </button>
                  <div className="text-sm font-bold text-gray-700">
                    Total: <span style={{ color: "#FFC207" }}>{clp(formTotal)}</span>
                  </div>
                </div>
              </section>

              {/* ── 5. Términos ── */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Num n={5} /> Términos y Condiciones
                </h3>
                <textarea
                  rows={6}
                  value={form.termsConditions || ""}
                  onChange={(e) => setForm((f) => ({ ...f, termsConditions: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                />
              </section>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name}
                className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold text-black disabled:opacity-60"
                style={{ backgroundColor: "#FFC207" }}
              >
                {saving ? "Guardando..." : <><Check size={15} /> {editId ? "Actualizar" : "Crear Propuesta"}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Num({ n }: { n: number }) {
  return (
    <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-black flex-shrink-0"
      style={{ backgroundColor: "#FFC207" }}>
      {n}
    </span>
  );
}

function Field({ label, value, onChange, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
      />
    </div>
  );
}

export default function ProposalsPage() {
  return <Suspense><ProposalsContent /></Suspense>;
}
