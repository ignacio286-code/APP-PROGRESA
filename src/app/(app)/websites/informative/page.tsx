"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { useClient } from "@/lib/client-context";
import {
  Globe, Loader2, AlertCircle, CheckCircle2, Send, Eye, ChevronRight,
  FileText, Cpu, RefreshCw,
} from "lucide-react";

interface PageContent {
  pageName: string;
  slug: string;
  seoTitle: string;
  metaDescription: string;
  content: string;
  sections: string[];
}

interface SiteStructure {
  siteName: string;
  theme: string;
  pages: PageContent[];
  menuStructure: string[];
  globalMeta: { title: string; description: string; keywords: string[] };
}

const PAGE_TEMPLATES = [
  { id: "business", label: "Empresa / Servicios", pages: ["Inicio", "Nosotros", "Servicios", "Equipo", "Contacto"] },
  { id: "restaurant", label: "Restaurante", pages: ["Inicio", "Menú", "Nosotros", "Reservas", "Contacto"] },
  { id: "professional", label: "Profesional / Portafolio", pages: ["Inicio", "Sobre mí", "Servicios", "Portafolio", "Contacto"] },
  { id: "healthcare", label: "Salud / Médico", pages: ["Inicio", "Especialidades", "Médicos", "Citas", "Contacto"] },
];

export default function InformativeSitePage() {
  const { activeClient } = useClient();
  const [template, setTemplate] = useState("business");
  const [businessDesc, setBusinessDesc] = useState("");
  const [tone, setTone] = useState("profesional");
  const [selectedPages, setSelectedPages] = useState(["Inicio", "Nosotros", "Servicios", "Contacto"]);
  const [generating, setGenerating] = useState(false);
  const [structure, setStructure] = useState<SiteStructure | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [publishingPage, setPublishingPage] = useState<string | null>(null);
  const [publishResults, setPublishResults] = useState<Record<string, string>>({});
  const [previewPage, setPreviewPage] = useState<PageContent | null>(null);

  const hasWp = !!(activeClient?.wpUrl && activeClient?.wpUsername && activeClient?.wpAppPassword);

  const currentTemplate = PAGE_TEMPLATES.find((t) => t.id === template) || PAGE_TEMPLATES[0];

  async function generate() {
    if (!businessDesc.trim()) return;
    setGenerating(true);
    setError(null);
    setStructure(null);
    try {
      const res = await fetch("/api/websites/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "informative",
          clientName: activeClient?.name || "la empresa",
          businessDescription: businessDesc,
          pages: selectedPages,
          tone,
          wpTheme: "Generador de sitio Web",
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStructure(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setGenerating(false);
    }
  }

  async function publishPage(page: PageContent) {
    if (!activeClient?.wpUrl) return;
    setPublishingPage(page.slug);
    try {
      const res = await fetch("/api/wordpress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wpUrl: activeClient.wpUrl,
          wpUsername: activeClient.wpUsername,
          wpAppPassword: activeClient.wpAppPassword,
          endpoint: "pages",
          method: "POST",
          body: {
            title: page.pageName,
            slug: page.slug,
            content: page.content,
            status: "draft",
            meta: {
              rank_math_title: page.seoTitle,
              rank_math_description: page.metaDescription,
            },
          },
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPublishResults((prev) => ({ ...prev, [page.slug]: `✓ Publicado (ID: ${data.id})` }));
    } catch (err) {
      setPublishResults((prev) => ({ ...prev, [page.slug]: `Error: ${String(err)}` }));
    } finally {
      setPublishingPage(null);
    }
  }

  async function publishAll() {
    if (!structure) return;
    for (const page of structure.pages) {
      await publishPage(page);
    }
  }

  return (
    <div>
      <Header title="Sitio Informativo con IA" subtitle="Genera y publica páginas completas en WordPress" />

      <div className="p-6">
        {!activeClient ? (
          <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl mb-6">
            <AlertCircle size={20} className="text-yellow-600" />
            <p className="text-sm text-yellow-700">Selecciona un cliente activo.</p>
          </div>
        ) : !hasWp ? (
          <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-xl mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-orange-500" />
              <p className="text-sm text-orange-700"><strong>{activeClient.name}</strong> no tiene WordPress configurado.</p>
            </div>
            <a href="/clients" className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg text-white bg-orange-500">
              Configurar <ChevronRight size={12} />
            </a>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl mb-6">
            <CheckCircle2 size={16} className="text-green-500" />
            <p className="text-sm text-green-700">WordPress conectado — <code className="bg-green-100 px-1 rounded">{activeClient.wpUrl}</code></p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Config */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Tipo de sitio</h3>
              <div className="grid grid-cols-2 gap-2">
                {PAGE_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTemplate(t.id);
                      setSelectedPages(t.pages.slice(0, 4));
                    }}
                    className={`p-3 rounded-xl border text-left text-xs transition-all ${
                      template === t.id ? "border-yellow-400" : "border-gray-200 hover:bg-gray-50"
                    }`}
                    style={template === t.id ? { backgroundColor: "#FFC20715" } : {}}
                  >
                    <p className="font-semibold text-gray-900">{t.label}</p>
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del negocio *</label>
                <textarea
                  value={businessDesc}
                  onChange={(e) => setBusinessDesc(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                  placeholder={`ej: Somos ${activeClient?.name || "una empresa"} especializada en... Nuestros servicios incluyen... Nuestro diferencial es...`}
                />
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Páginas a generar</p>
                <div className="flex flex-wrap gap-2">
                  {currentTemplate.pages.map((p) => (
                    <button
                      key={p}
                      onClick={() =>
                        setSelectedPages((prev) =>
                          prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
                        )
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        selectedPages.includes(p) ? "text-black border-yellow-400" : "border-gray-200 text-gray-600"
                      }`}
                      style={selectedPages.includes(p) ? { backgroundColor: "#FFC20730" } : {}}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tono de comunicación</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  {["profesional", "amigable", "aspiracional", "técnico", "elegante"].map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                onClick={generate}
                disabled={generating || !businessDesc.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#FFC207" }}
              >
                {generating ? <Loader2 size={16} className="animate-spin" /> : <Cpu size={16} />}
                {generating ? "Generando sitio..." : `Generar ${selectedPages.length} páginas`}
              </button>
            </div>
          </div>

          {/* Result */}
          <div className="lg:col-span-3 space-y-4">
            {generating && (
              <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-gray-200">
                <Loader2 size={32} className="animate-spin text-yellow-500 mb-3" />
                <p className="text-gray-500 text-sm">Generando contenido para {selectedPages.length} páginas...</p>
              </div>
            )}

            {structure && !generating && (
              <>
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                  <div>
                    <p className="font-bold text-gray-900">{structure.siteName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{structure.pages.length} páginas generadas · Tema: {structure.theme}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={generate}
                      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                      title="Regenerar"
                    >
                      <RefreshCw size={14} className="text-gray-500" />
                    </button>
                    {hasWp && (
                      <button
                        onClick={publishAll}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-black"
                        style={{ backgroundColor: "#FFC207" }}
                      >
                        <Send size={12} /> Publicar todo
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {structure.pages.map((page) => (
                    <div key={page.slug} className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-gray-400" />
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{page.pageName}</p>
                            <p className="text-xs text-gray-400">/{page.slug}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {publishResults[page.slug] && (
                            <span className={`text-xs font-medium ${publishResults[page.slug].includes("Error") ? "text-red-600" : "text-green-600"}`}>
                              {publishResults[page.slug]}
                            </span>
                          )}
                          <button
                            onClick={() => setPreviewPage(previewPage?.slug === page.slug ? null : page)}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200"
                          >
                            <Eye size={14} className="text-gray-500" />
                          </button>
                          {hasWp && (
                            <button
                              onClick={() => publishPage(page)}
                              disabled={publishingPage === page.slug}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-black disabled:opacity-50"
                              style={{ backgroundColor: "#FFC207" }}
                            >
                              {publishingPage === page.slug ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                              Publicar
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">{page.metaDescription}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {page.sections.map((s) => (
                          <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{s}</span>
                        ))}
                      </div>
                      {previewPage?.slug === page.slug && (
                        <div
                          className="mt-3 p-3 bg-gray-50 rounded-xl text-sm text-gray-700 max-h-60 overflow-y-auto"
                          dangerouslySetInnerHTML={{ __html: page.content.substring(0, 1000) + "..." }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {!structure && !generating && (
              <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-dashed border-gray-200">
                <Globe size={32} className="text-gray-300 mb-3" />
                <p className="text-gray-400 text-sm">Las páginas generadas aparecerán aquí</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
