"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { CheckCircle, Loader2, FileText } from "lucide-react";

const SERVICES = [
  "Social Media", "Meta Business", "Google Ads (SEM)", "SEO", "Web - Landing Page",
  "Web - Ecommerce", "Audio Visual", "Fotografía", "Diseño Gráfico",
  "Email Marketing", "Consultoría", "Prospección LinkedIn", "Otro Servicio",
];

const PLANS = ["PLAN S", "PLAN M", "PLAN L", "PLAN XL", "No aplica Plan", "Personalizado"];

const EMPTY_FORM = () => ({
  name: "", rut: "", giro: "", contactPerson: "", cargo: "", phone: "", email: "",
  website: "", location: "", city: "", hasSocialMedia: "NO", socialMediaNames: "",
  description: "", objective: "", competitors: "", keywords: "",
  budget: "", selectedPlan: "", services: [] as string[], notes: "",
});

export default function IntakePage() {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_FORM());
  const [createdLeadId, setCreatedLeadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function toggleService(svc: string) {
    setForm(prev => ({
      ...prev,
      services: prev.services.includes(svc)
        ? prev.services.filter(s => s !== svc)
        : [...prev.services, svc],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("El nombre es obligatorio"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          rut: form.rut || null,
          giro: form.giro || null,
          contactPerson: form.contactPerson || null,
          cargo: form.cargo || null,
          phone: form.phone || null,
          email: form.email || null,
          website: form.website || null,
          location: form.location || null,
          city: form.city || null,
          hasSocialMedia: form.hasSocialMedia,
          socialMediaNames: form.socialMediaNames || null,
          description: form.description || null,
          objective: form.objective || null,
          competitors: form.competitors || null,
          keywords: form.keywords || null,
          budget: form.budget ? parseFloat(form.budget) : null,
          selectedPlan: form.selectedPlan || null,
          services: form.services.join(", ") || null,
          notes: form.notes || null,
          status: "Nuevo",
          contactDate: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      const lead = await res.json();
      setCreatedLeadId(lead.id);
      setSuccess(true);
    } catch {
      setError("Error al enviar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header title="Toma de Requerimientos" />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow p-10 max-w-md w-full text-center">
            <CheckCircle size={56} className="mx-auto mb-4 text-green-500" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">¡Lead creado!</h2>
            <p className="text-gray-500 text-sm mb-6">El cliente potencial fue registrado. ¿Quieres generar una propuesta ahora?</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push(`/crm/proposals?leadId=${createdLeadId}`)}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm text-black"
                style={{ backgroundColor: "#FFC207" }}
              >
                <FileText size={16} />
                Generar Propuesta
              </button>
              <button
                onClick={() => { setSuccess(false); setCreatedLeadId(null); setForm(EMPTY_FORM()); }}
                className="px-6 py-2.5 rounded-lg font-semibold text-sm text-gray-600 border border-gray-200 hover:bg-gray-50"
              >
                Nuevo requerimiento
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header title="Toma de Requerimientos" subtitle="Completa el formulario para crear un lead y cotizar" />
      <main className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Datos empresa */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Datos de la Empresa</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre empresa / cliente *</label>
                <input value={form.name} onChange={e => set("name", e.target.value)} required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">RUT</label>
                <input value={form.rut} onChange={e => set("rut", e.target.value)} placeholder="12.345.678-9"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Giro comercial</label>
                <input value={form.giro} onChange={e => set("giro", e.target.value)} placeholder="Ej: Retail, Gastronomía, Salud..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Sitio web</label>
                <input value={form.website} onChange={e => set("website", e.target.value)} placeholder="https://..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Dirección</label>
                <input value={form.location} onChange={e => set("location", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ciudad</label>
                <input value={form.city} onChange={e => set("city", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
              </div>
            </div>
          </div>

          {/* Contacto */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Datos de Contacto</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre encargado</label>
                <input value={form.contactPerson} onChange={e => set("contactPerson", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cargo</label>
                <input value={form.cargo} onChange={e => set("cargo", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label>
                <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="56912345678"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
              </div>
            </div>
          </div>

          {/* Redes sociales */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Redes Sociales</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">¿Tiene redes sociales?</label>
                <select value={form.hasSocialMedia} onChange={e => set("hasSocialMedia", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400">
                  <option>SI</option>
                  <option>NO</option>
                </select>
              </div>
              {form.hasSocialMedia === "SI" && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nombres de cuentas</label>
                  <input value={form.socialMediaNames} onChange={e => set("socialMediaNames", e.target.value)}
                    placeholder="@empresa, @empresa.cl..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                </div>
              )}
            </div>
          </div>

          {/* Descripción y objetivo */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Información Comercial</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Breve descripción de la empresa</label>
                <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Objetivo de la empresa</label>
                <textarea value={form.objective} onChange={e => set("objective", e.target.value)} rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Competidores principales</label>
                  <input value={form.competitors} onChange={e => set("competitors", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Palabras clave</label>
                  <input value={form.keywords} onChange={e => set("keywords", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Servicios y presupuesto */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Servicios y Presupuesto</h3>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-2">Servicios solicitados</label>
              <div className="flex flex-wrap gap-2">
                {SERVICES.map(svc => (
                  <button key={svc} type="button"
                    onClick={() => toggleService(svc)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      form.services.includes(svc)
                        ? "text-black border-yellow-400"
                        : "border-gray-200 text-gray-600 hover:border-gray-400"
                    }`}
                    style={form.services.includes(svc) ? { backgroundColor: "#FFC207" } : {}}>
                    {svc}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Plan seleccionado</label>
                <select value={form.selectedPlan} onChange={e => set("selectedPlan", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400">
                  <option value="">-- Seleccionar --</option>
                  {PLANS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Presupuesto tentativo (CLP)</label>
                <input type="number" value={form.budget} onChange={e => set("budget", e.target.value)}
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
              </div>
            </div>
          </div>

          {/* Notas */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Notas adicionales</h3>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none" />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="flex justify-end pb-6">
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm text-black disabled:opacity-60"
              style={{ backgroundColor: "#FFC207" }}>
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Guardando..." : "Crear Lead y Cotizar"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
