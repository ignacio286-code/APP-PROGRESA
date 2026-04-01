"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { useClient, Client } from "@/lib/client-context";
import {
  Plus, Pencil, Trash2, CheckCircle2, Globe, Building2, X,
  XCircle, Eye, EyeOff, ChevronDown, ChevronUp, Loader2,
  Info, ExternalLink, Copy, Check,
} from "lucide-react";

const EMPTY_FORM = {
  name: "",
  website: "",
  industry: "",
  logoUrl: "",
  wpUrl: "",
  wpUsername: "",
  wpAppPassword: "",
  metaAppId: "",
  metaAppSecret: "",
  metaAccessToken: "",
  metaAdAccountId: "",
  googleClientId: "",
  googleClientSecret: "",
  googleDeveloperToken: "",
  googleCustomerId: "",
  nanobanaApiKey: "",
  remotionApiKey: "",
  remotionAwsRegion: "",
};

type FormData = typeof EMPTY_FORM;

// ── Copy button ────────────────────────────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 ml-1"
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}

// ── Step instructions inside each section ────────────────────────────────────
interface Step {
  text: string;
  link?: { label: string; url: string };
  code?: string;
}
function Instructions({ steps }: { steps: Step[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="col-span-2 mb-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium"
      >
        <Info size={13} />
        {open ? "Ocultar instrucciones" : "Ver instrucciones paso a paso"}
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {open && (
        <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2.5">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <div className="text-xs text-gray-700 leading-relaxed">
                {step.text}
                {step.link && (
                  <a
                    href={step.link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 ml-1 text-blue-600 underline hover:text-blue-800 font-medium"
                  >
                    {step.link.label} <ExternalLink size={11} />
                  </a>
                )}
                {step.code && (
                  <span className="inline-flex items-center gap-1">
                    <code className="ml-1 px-1.5 py-0.5 bg-white border border-blue-200 rounded text-blue-700 font-mono text-xs">{step.code}</code>
                    <CopyBtn text={step.code} />
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Password input ─────────────────────────────────────────────────────────────
function PasswordInput({ label, name, value, onChange, placeholder }: {
  label: string; name: keyof FormData; value: string;
  onChange: (name: keyof FormData, value: string) => void; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          placeholder={placeholder || "••••••••"}
        />
        <button type="button" onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

// ── Section collapsible ────────────────────────────────────────────────────────
function Section({ title, icon, badge, open, onToggle, children }: {
  title: string; icon: string; badge?: string;
  open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button type="button" onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-semibold text-gray-800">{title}</span>
          {badge && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">{badge}</span>}
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {open && <div className="p-4 grid grid-cols-2 gap-4">{children}</div>}
    </div>
  );
}

// ── TextField helper ───────────────────────────────────────────────────────────
function TextField({ label, name, value, onChange, placeholder, colSpan }: {
  label: string; name: keyof FormData; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; colSpan?: boolean;
}) {
  return (
    <div className={colSpan ? "col-span-2" : ""}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input name={name} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ClientsPage() {
  const { clients, activeClient, setActiveClient, refreshClients } = useClient();
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState({ wp: true, meta: false, google: false, remotion: false, other: false });

  function toggleSection(key: keyof typeof openSections) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function openNew() {
    setEditingClient(null); setForm(EMPTY_FORM); setSaveError(null);
    setOpenSections({ wp: true, meta: false, google: false, remotion: false, other: false });
    setShowModal(true);
  }

  function openEdit(client: Client) {
    setSaveError(null); setEditingClient(client);
    setForm({
      name: client.name || "", website: client.website || "", industry: client.industry || "", logoUrl: client.logoUrl || "",
      wpUrl: client.wpUrl || "", wpUsername: client.wpUsername || "", wpAppPassword: client.wpAppPassword || "",
      metaAppId: client.metaAppId || "", metaAppSecret: client.metaAppSecret || "",
      metaAccessToken: client.metaAccessToken || "", metaAdAccountId: client.metaAdAccountId || "",
      googleClientId: client.googleClientId || "", googleClientSecret: client.googleClientSecret || "",
      googleDeveloperToken: client.googleDeveloperToken || "", googleCustomerId: client.googleCustomerId || "",
      nanobanaApiKey: client.nanobanaApiKey || "",
      remotionApiKey: (client as unknown as Record<string, string>).remotionApiKey || "",
      remotionAwsRegion: (client as unknown as Record<string, string>).remotionAwsRegion || "",
    });
    setOpenSections({ wp: true, meta: true, google: true, remotion: true, other: true });
    setShowModal(true);
  }

  function handleChange(name: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }
  function handleTextChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    handleChange(e.target.name as keyof FormData, e.target.value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setSaveError(null);
    try {
      const url = editingClient ? `/api/clients/${editingClient.id}` : "/api/clients";
      const res = await fetch(url, { method: editingClient ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) { await refreshClients(); setShowModal(false); }
      else { const d = await res.json().catch(() => ({})); setSaveError(d.error || `Error ${res.status}`); }
    } catch (err) { setSaveError(`Error: ${String(err)}`); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este cliente?")) return;
    setDeleting(id);
    try { await fetch(`/api/clients/${id}`, { method: "DELETE" }); await refreshClients(); }
    finally { setDeleting(null); }
  }

  const industries = ["Retail", "E-commerce", "Restaurantes", "Salud", "Educación", "Inmobiliaria", "Tecnología", "Moda", "Automotriz", "Turismo", "Otro"];

  // ── Instruction sets ──────────────────────────────────────────────────────
  const wpInstructions: Step[] = [
    { text: "Ingresa al panel de administración de WordPress del cliente." },
    { text: "Ve a la sección de tu perfil de usuario:", link: { label: "Usuarios → Tu perfil", url: form.wpUrl ? `${form.wpUrl.replace(/\/$/, "")}/wp-admin/profile.php` : "https://tu-sitio.com/wp-admin/profile.php" } },
    { text: "Desplázate hacia abajo hasta la sección «Contraseñas de aplicación»." },
    { text: "En el campo de nombre escribe", code: "MarketPro" },
    { text: "Haz clic en «Añadir nueva contraseña de aplicación». WordPress generará una contraseña automáticamente." },
    { text: "Copia la contraseña que aparece (se muestra UNA sola vez) y pégala en el campo «Contraseña de aplicación» de abajo." },
    { text: "El usuario WP es tu nombre de usuario de WordPress (visible en la parte superior derecha del admin)." },
  ];

  const metaInstructions: Step[] = [
    { text: "Crea o accede a tu aplicación en Meta for Developers:", link: { label: "developers.facebook.com/apps", url: "https://developers.facebook.com/apps" } },
    { text: "Haz clic en «Crear app» → tipo «Negocios» → sigue el asistente." },
    { text: "En «Configuración → Básica» encontrarás el App ID y el App Secret. Cópielos." },
    { text: "Para el Access Token: usa la herramienta Graph API Explorer →", link: { label: "Explorador de Graph API", url: "https://developers.facebook.com/tools/explorer/" } },
    { text: "En el explorador selecciona tu app, haz clic en «Generar token de acceso» con permisos: ads_management, ads_read, business_management." },
    { text: "Para el Ad Account ID: ve a Meta Business Suite →", link: { label: "business.facebook.com/adsmanager", url: "https://business.facebook.com/adsmanager" } },
    { text: "En la columna izquierda verás el ID de cuenta publicitaria con formato", code: "act_123456789" },
  ];

  const googleInstructions: Step[] = [
    { text: "Ve a Google Cloud Console y crea un proyecto nuevo:", link: { label: "console.cloud.google.com", url: "https://console.cloud.google.com" } },
    { text: "En «APIs y servicios → Biblioteca» busca y activa «Google Ads API»." },
    { text: "Ve a «APIs y servicios → Credenciales» → «Crear credenciales» → «ID de cliente OAuth 2.0»." },
    { text: "Tipo de aplicación: «Aplicación web». Copia el Client ID y Client Secret generados." },
    { text: "Para el Developer Token: abre Google Ads como administrador →", link: { label: "ads.google.com", url: "https://ads.google.com" } },
    { text: "Ve a «Herramientas → Centro de API de Google Ads». Copia el token de desarrollador." },
    { text: "El Customer ID es el número de 10 dígitos que aparece en la esquina superior derecha de Google Ads, formato", code: "123-456-7890" },
  ];

  const remotionInstructions: Step[] = [
    { text: "Remotion te permite generar videos programáticamente con React. Primero instala Remotion en tu proyecto:", link: { label: "Docs de Remotion", url: "https://www.remotion.dev/docs" } },
    { text: "Para renderizado en la nube usa Remotion Lambda. Instala la CLI:", code: "npm i -g @remotion/cli" },
    { text: "Configura AWS: crea una cuenta en", link: { label: "aws.amazon.com", url: "https://aws.amazon.com" } },
    { text: "En AWS IAM, crea un usuario con permisos de Lambda y S3. Guarda el Access Key y Secret Key." },
    { text: "Despliega la función Lambda de Remotion con el comando:", code: "npx remotion lambda functions deploy" },
    { text: "La región recomendada para Latinoamérica es", code: "us-east-1" },
    { text: "Para una alternativa sin AWS, usa Remotion Cloud Run (Google Cloud):", link: { label: "remotion.dev/docs/cloudrun", url: "https://www.remotion.dev/docs/cloudrun" } },
    { text: "Pega el API Key generado y la región AWS en los campos de abajo." },
  ];

  const nanobanaInstructions: Step[] = [
    { text: "Accede a tu cuenta de Nanobana:", link: { label: "nanobana.com", url: "https://nanobana.com" } },
    { text: "Ve a «Configuración → API» o «Mi cuenta → API Keys»." },
    { text: "Genera una nueva API Key y cópiala. Pégala en el campo de abajo." },
  ];

  return (
    <div>
      <Header title="Gestión de Clientes" subtitle="Administra tus clientes y sus credenciales de integración" />

      <div className="p-6">
        {activeClient && (
          <div className="mb-6 flex items-center gap-3 p-4 rounded-xl border" style={{ backgroundColor: "#FFC20715", borderColor: "#FFC20740" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-black font-bold" style={{ backgroundColor: "#FFC207" }}>
              {activeClient.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm text-gray-500">Cliente activo — todas las herramientas trabajan sobre este cliente</p>
              <p className="font-semibold text-gray-900">{activeClient.name}</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">{clients.length} clientes</h2>
          <button onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-black hover:opacity-90"
            style={{ backgroundColor: "#FFC207" }}>
            <Plus size={16} /> Nuevo cliente
          </button>
        </div>

        {clients.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
            <Building2 size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Aún no tienes clientes</p>
            <p className="text-sm text-gray-400 mt-1">Crea tu primer cliente para comenzar</p>
            <button onClick={openNew} className="mt-4 px-5 py-2 rounded-lg text-sm font-semibold text-black" style={{ backgroundColor: "#FFC207" }}>
              Crear cliente
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {clients.map((client) => {
              const isActive = activeClient?.id === client.id;
              return (
                <div key={client.id} className={`bg-white rounded-xl border p-5 transition-all ${isActive ? "border-yellow-400 shadow-md" : "border-gray-200"}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-black font-bold text-lg"
                        style={{ backgroundColor: isActive ? "#FFC207" : "#f3f4f6" }}>
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{client.name}</p>
                        {client.industry && <p className="text-xs text-gray-400">{client.industry}</p>}
                      </div>
                    </div>
                    {isActive && (
                      <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: "#FFC20720", color: "#b8860b" }}>
                        <CheckCircle2 size={12} /> Activo
                      </span>
                    )}
                  </div>
                  {client.website && (
                    <a href={client.website.startsWith("http") ? client.website : `https://${client.website}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-3 truncate">
                      <Globe size={12} /> {client.website}
                    </a>
                  )}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {client.wpUrl && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">WordPress</span>}
                    {client.metaAccessToken && <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium">Meta Ads</span>}
                    {(client.googleRefreshToken || client.googleClientId) && <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-medium">Google Ads</span>}
                    {(client as unknown as Record<string, string>).remotionApiKey && <span className="text-xs px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 font-medium">Remotion</span>}
                    {client.nanobanaApiKey && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 font-medium">Nanobana</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {!isActive && (
                      <button onClick={() => setActiveClient(client)}
                        className="flex-1 py-2 rounded-lg text-xs font-semibold text-black" style={{ backgroundColor: "#FFC207" }}>
                        Seleccionar
                      </button>
                    )}
                    <button onClick={() => openEdit(client)} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200">
                      <Pencil size={14} className="text-gray-600" />
                    </button>
                    <button onClick={() => handleDelete(client.id)} disabled={deleting === client.id} className="p-2 rounded-lg bg-red-50 hover:bg-red-100">
                      {deleting === client.id ? <Loader2 size={14} className="text-red-400 animate-spin" /> : <Trash2 size={14} className="text-red-500" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">
                {editingClient ? `Editar cliente — ${editingClient.name}` : "Nuevo cliente"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Basic info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del cliente *</label>
                  <input required name="name" value={form.name} onChange={handleTextChange}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="Nombre de la empresa" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sitio web</label>
                  <input name="website" value={form.website} onChange={handleTextChange}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="https://ejemplo.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industria</label>
                  <select name="industry" value={form.industry} onChange={handleTextChange}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400">
                    <option value="">Seleccionar...</option>
                    {industries.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
              </div>

              {/* Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo del cliente (URL)</label>
                <div className="flex items-center gap-3">
                  <input name="logoUrl" value={form.logoUrl} onChange={handleTextChange}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="https://ejemplo.com/logo.png" />
                  {form.logoUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={form.logoUrl} alt="Logo" style={{ width: 40, height: 40, objectFit: "contain", borderRadius: 8, border: "1px solid #e5e7eb" }} />
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">Se mostrará en los informes analíticos del cliente</p>
              </div>

              {/* ── WordPress ── */}
              <Section title="WordPress" icon="🌐" open={openSections.wp} onToggle={() => toggleSection("wp")}>
                <Instructions steps={wpInstructions} />
                <div className="col-span-2">
                  <TextField label="URL de WordPress" name="wpUrl" value={form.wpUrl}
                    onChange={handleTextChange} placeholder="https://mitienda.com" colSpan />
                </div>
                <TextField label="Usuario de WordPress" name="wpUsername" value={form.wpUsername}
                  onChange={handleTextChange} placeholder="admin" />
                <PasswordInput label="Contraseña de aplicación WP" name="wpAppPassword"
                  value={form.wpAppPassword} onChange={handleChange} placeholder="xxxx xxxx xxxx xxxx" />
              </Section>

              {/* ── Meta ── */}
              <Section title="Meta Business (Facebook & Instagram Ads)" icon="📘" open={openSections.meta} onToggle={() => toggleSection("meta")}>
                <Instructions steps={metaInstructions} />
                <TextField label="App ID" name="metaAppId" value={form.metaAppId}
                  onChange={handleTextChange} placeholder="123456789012345" />
                <PasswordInput label="App Secret" name="metaAppSecret" value={form.metaAppSecret}
                  onChange={handleChange} placeholder="abc123..." />
                <div className="col-span-2">
                  <PasswordInput label="Access Token (largo plazo)" name="metaAccessToken"
                    value={form.metaAccessToken} onChange={handleChange} placeholder="EAABwzLixnjYBO..." />
                </div>
                <div className="col-span-2">
                  <TextField label="Ad Account ID" name="metaAdAccountId" value={form.metaAdAccountId}
                    onChange={handleTextChange} placeholder="act_123456789" colSpan />
                </div>
              </Section>

              {/* ── Google ── */}
              <Section title="Google Ads" icon="🔴" open={openSections.google} onToggle={() => toggleSection("google")}>
                <Instructions steps={googleInstructions} />
                <div className="col-span-2">
                  <TextField label="Client ID (OAuth)" name="googleClientId" value={form.googleClientId}
                    onChange={handleTextChange} placeholder="123456789-abc.apps.googleusercontent.com" colSpan />
                </div>
                <PasswordInput label="Client Secret" name="googleClientSecret"
                  value={form.googleClientSecret} onChange={handleChange} />
                <PasswordInput label="Developer Token" name="googleDeveloperToken"
                  value={form.googleDeveloperToken} onChange={handleChange} placeholder="AbCdEfGhIj123" />
                <div className="col-span-2">
                  <TextField label="Customer ID (cuenta de Google Ads)" name="googleCustomerId"
                    value={form.googleCustomerId} onChange={handleTextChange} placeholder="123-456-7890" colSpan />
                </div>
              </Section>

              {/* ── Remotion ── */}
              <Section title="Remotion — Generación de Videos" icon="🎬" badge="Video IA" open={openSections.remotion} onToggle={() => toggleSection("remotion")}>
                <Instructions steps={remotionInstructions} />
                <div className="col-span-2 p-3 bg-violet-50 border border-violet-100 rounded-lg text-xs text-violet-700">
                  <strong>¿Qué es Remotion?</strong> Es una librería React para crear videos programáticamente.
                  Con Remotion Lambda puedes renderizar videos en la nube directamente desde esta app: animaciones, videos de productos, ads de video, recaps de campañas, etc.
                </div>
                <div className="col-span-2">
                  <PasswordInput label="AWS Access Key ID (para Remotion Lambda)" name="remotionApiKey"
                    value={form.remotionApiKey} onChange={handleChange} placeholder="AKIAIOSFODNN7EXAMPLE" />
                </div>
                <TextField label="Región AWS" name="remotionAwsRegion" value={form.remotionAwsRegion}
                  onChange={handleTextChange} placeholder="us-east-1" />
                <div className="flex items-center">
                  <a href="https://www.remotion.dev/docs/lambda/setup" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-800 font-medium mt-5">
                    <ExternalLink size={12} /> Ver guía completa de Remotion Lambda
                  </a>
                </div>
              </Section>

              {/* ── Otros ── */}
              <Section title="Otras integraciones" icon="🔌" open={openSections.other} onToggle={() => toggleSection("other")}>
                <Instructions steps={nanobanaInstructions} />
                <div className="col-span-2">
                  <PasswordInput label="Nanobana API Key" name="nanobanaApiKey"
                    value={form.nanobanaApiKey} onChange={handleChange} />
                </div>
              </Section>

              {saveError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <XCircle size={16} className="shrink-0 mt-0.5" /><span>{saveError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-black disabled:opacity-50"
                  style={{ backgroundColor: "#FFC207" }}>
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {editingClient ? "Guardar cambios" : "Crear cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
