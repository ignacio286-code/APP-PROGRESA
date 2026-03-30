"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { useClient } from "@/lib/client-context";
import {
  Globe, Loader2, AlertCircle, CheckCircle2, Sparkles,
  ChevronDown, ExternalLink, RefreshCw, Plus,
} from "lucide-react";

interface WpTheme {
  stylesheet: string;
  name: { rendered: string };
  status: string;
  template: string;
}

interface GeneratedPage {
  title: string;
  slug: string;
  content: string;
  seoTitle: string;
  metaDescription: string;
  focusKeyword: string;
  status?: "pending" | "publishing" | "done" | "error";
  wpId?: number;
  error?: string;
}

const PAGE_TEMPLATES = [
  { id: "home", label: "Página de Inicio", desc: "Presentación principal del negocio" },
  { id: "about", label: "Quiénes Somos", desc: "Historia, misión, visión y valores" },
  { id: "services", label: "Servicios", desc: "Descripción de los servicios ofrecidos" },
  { id: "contact", label: "Contacto", desc: "Formulario e información de contacto" },
  { id: "blog", label: "Blog / Noticias", desc: "Sección de artículos y novedades" },
];

export default function CreateWpPage() {
  const { activeClient } = useClient();
  const [themes, setThemes] = useState<WpTheme[]>([]);
  const [activeTheme, setActiveTheme] = useState<string>("");
  const [loadingThemes, setLoadingThemes] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>(["home", "about", "services", "contact"]);
  const [businessDesc, setBusinessDesc] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [targetCity, setTargetCity] = useState("");
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [generatedPages, setGeneratedPages] = useState<GeneratedPage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"config" | "preview" | "done">("config");

  const hasWp = !!(activeClient?.wpUrl && activeClient?.wpUsername && activeClient?.wpAppPassword);

  async function loadThemes() {
    if (!hasWp) return;
    setLoadingThemes(true);
    setError(null);
    try {
      const res = await fetch("/api/wordpress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wpUrl: activeClient!.wpUrl,
          wpUsername: activeClient!.wpUsername,
          wpAppPassword: activeClient!.wpAppPassword,
          endpoint: "themes?status=active",
          apiNamespace: "wp/v2",
          method: "GET",
        }),
      });
      const json = await res.json();
      const data = json._data || json;
      if (Array.isArray(data) && data.length > 0) {
        setThemes(data);
        setActiveTheme(data[0].stylesheet);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoadingThemes(false);
    }
  }

  async function generatePages() {
    if (!businessDesc.trim()) { setError("Describe el negocio antes de generar."); return; }
    setGenerating(true); setError(null);
    try {
      const res = await fetch("/api/websites/generate-wp-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessDesc,
          businessName: businessName || activeClient?.name,
          targetCity,
          templates: selectedTemplates,
          clientName: activeClient?.name,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setGeneratedPages(data.pages.map((p: GeneratedPage) => ({ ...p, status: "pending" })));
      setStep("preview");
    } catch (err) {
      setError(String(err));
    } finally {
      setGenerating(false);
    }
  }

  async function publishPages() {
    if (!hasWp || !generatedPages.length) return;
    setPublishing(true);
    for (let i = 0; i < generatedPages.length; i++) {
      const page = generatedPages[i];
      setGeneratedPages(prev => prev.map((p, idx) => idx === i ? { ...p, status: "publishing" } : p));
      try {
        const res = await fetch("/api/wordpress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wpUrl: activeClient!.wpUrl,
            wpUsername: activeClient!.wpUsername,
            wpAppPassword: activeClient!.wpAppPassword,
            endpoint: "pages",
            apiNamespace: "wp/v2",
            method: "POST",
            body: {
              title: page.title,
              slug: page.slug,
              content: page.content,
              status: "publish",
              meta: {
                rank_math_title: page.seoTitle,
                rank_math_description: page.metaDescription,
                rank_math_focus_keyword: page.focusKeyword,
                rank_math_og_title: page.seoTitle,
                rank_math_og_description: page.metaDescription,
                rank_math_twitter_title: page.seoTitle,
                rank_math_twitter_description: page.metaDescription,
              },
            },
          }),
        });
        const json = await res.json();
        const result = json._data || json;
        if (result.id) {
          setGeneratedPages(prev => prev.map((p, idx) => idx === i ? { ...p, status: "done", wpId: result.id } : p));
        } else {
          throw new Error(result.error || "Error al publicar");
        }
      } catch (err) {
        setGeneratedPages(prev => prev.map((p, idx) => idx === i ? { ...p, status: "error", error: String(err) } : p));
      }
    }
    setPublishing(false);
    setStep("done");
  }

  if (!activeClient) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header title="Crear en WordPress" subtitle="Genera páginas con IA y publícalas en tu WordPress" />
        <main className="flex-1 p-6">
          <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <AlertCircle size={20} className="text-yellow-600 shrink-0" />
            <p className="text-sm text-yellow-700">Selecciona un cliente activo primero.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header title="Crear en WordPress" subtitle="Genera páginas con IA y publícalas usando el tema instalado" />
      <main className="flex-1 p-4 md:p-6 space-y-5 max-w-3xl">

        {!hasWp && (
          <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
            <AlertCircle size={20} className="text-orange-600 shrink-0" />
            <p className="text-sm text-orange-700">El cliente <strong>{activeClient.name}</strong> no tiene WordPress configurado en Gestión de Clientes.</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle size={20} className="text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {step === "config" && (
          <>
            {/* Tema activo */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Globe size={16} className="text-blue-500" />Tema WordPress
                </h2>
                <button onClick={loadThemes} disabled={loadingThemes || !hasWp}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 disabled:opacity-50">
                  {loadingThemes ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                  Detectar tema
                </button>
              </div>
              {themes.length > 0 ? (
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-800">{themes[0].name?.rendered || activeTheme}</p>
                    <p className="text-xs text-green-600">Tema activo detectado — el contenido se publicará con este tema</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Haz click en "Detectar tema" para ver el tema instalado en WordPress.</p>
              )}
            </div>

            {/* Información del negocio */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <h2 className="font-semibold text-gray-900">Información del negocio</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre del negocio</label>
                  <input value={businessName} onChange={e => setBusinessName(e.target.value)}
                    placeholder={activeClient.name}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Ciudad / Región objetivo</label>
                  <input value={targetCity} onChange={e => setTargetCity(e.target.value)}
                    placeholder="Ej: Santiago, Chile"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción del negocio *</label>
                <textarea value={businessDesc} onChange={e => setBusinessDesc(e.target.value)} rows={4}
                  placeholder="Describe el negocio: qué vende, a quién, qué lo diferencia, servicios principales, público objetivo..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none" />
              </div>
            </div>

            {/* Páginas a generar */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <h2 className="font-semibold text-gray-900">Páginas a crear</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PAGE_TEMPLATES.map(t => (
                  <label key={t.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${selectedTemplates.includes(t.id) ? "border-yellow-400 bg-yellow-50" : "border-gray-200 hover:bg-gray-50"}`}>
                    <input type="checkbox" checked={selectedTemplates.includes(t.id)}
                      onChange={e => setSelectedTemplates(prev => e.target.checked ? [...prev, t.id] : prev.filter(x => x !== t.id))}
                      className="mt-0.5 accent-yellow-400" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{t.label}</p>
                      <p className="text-xs text-gray-400">{t.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              <button onClick={() => {}} className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 mt-1">
                <Plus size={13} />Página personalizada (próximamente)
              </button>
            </div>

            <button onClick={generatePages} disabled={generating || !businessDesc.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-black disabled:opacity-50"
              style={{ backgroundColor: "#FFC207" }}>
              {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {generating ? "Generando contenido con IA..." : `Generar ${selectedTemplates.length} página${selectedTemplates.length !== 1 ? "s" : ""} con IA`}
            </button>
          </>
        )}

        {step === "preview" && generatedPages.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Vista previa del contenido generado</h2>
              <button onClick={() => setStep("config")} className="text-sm text-gray-500 hover:text-gray-700">← Volver</button>
            </div>

            <div className="space-y-4">
              {generatedPages.map((page, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{page.title}</h3>
                      <p className="text-xs text-gray-400 font-mono">/{page.slug}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">SEO: {page.seoTitle.length}/60</span>
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Desc: {page.metaDescription.length}/160</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-semibold text-gray-500">Keyword: </span>
                      <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{page.focusKeyword}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-500">SEO Title: </span>
                      <span className="text-gray-700">{page.seoTitle}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-500">Meta Description: </span>
                      <span className="text-gray-600">{page.metaDescription}</span>
                    </div>
                  </div>
                  <details className="mt-3">
                    <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">Ver contenido HTML</summary>
                    <div className="mt-2 bg-gray-50 rounded-lg p-3 text-xs font-mono text-gray-600 overflow-x-auto max-h-40 overflow-y-auto whitespace-pre-wrap">
                      {page.content}
                    </div>
                  </details>
                </div>
              ))}
            </div>

            <button onClick={publishPages} disabled={publishing || !hasWp}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-black disabled:opacity-50"
              style={{ backgroundColor: "#FFC207" }}>
              {publishing ? <Loader2 size={16} className="animate-spin" /> : <Globe size={16} />}
              {publishing ? "Publicando en WordPress..." : "Publicar todas las páginas en WordPress"}
            </button>
          </>
        )}

        {step === "done" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 size={24} className="text-green-500" />
              <h2 className="font-bold text-gray-900">¡Páginas publicadas!</h2>
            </div>
            {generatedPages.map((page, i) => (
              <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${page.status === "done" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{page.title}</p>
                  {page.error && <p className="text-xs text-red-600">{page.error}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {page.status === "done" ? (
                    <>
                      <CheckCircle2 size={16} className="text-green-600" />
                      <a href={`${activeClient.wpUrl?.replace(/\/$/, "")}/${page.slug}`} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 bg-green-100 rounded-lg hover:bg-green-200">
                        <ExternalLink size={13} className="text-green-700" />
                      </a>
                    </>
                  ) : (
                    <span className="text-xs text-red-600">Error</span>
                  )}
                </div>
              </div>
            ))}
            <button onClick={() => { setStep("config"); setGeneratedPages([]); }}
              className="w-full py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
              Crear más páginas
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
