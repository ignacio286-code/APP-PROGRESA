"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { useClient } from "@/lib/client-context";
import {
  Globe, Loader2, AlertCircle, CheckCircle2, Sparkles,
  RefreshCw, Save, Pencil, ExternalLink, Eye, EyeOff,
} from "lucide-react";

interface WpPage {
  id: number;
  title: string;
  slug: string;
  link: string;
  status: string;
  content: string;
  seoTitle: string;
  metaDescription: string;
  focusKeyword: string;
}

export default function PageEditorPage() {
  const { activeClient } = useClient();
  const [pages, setPages] = useState<WpPage[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [selected, setSelected] = useState<WpPage | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editSeoTitle, setEditSeoTitle] = useState("");
  const [editMetaDesc, setEditMetaDesc] = useState("");
  const [editKeyword, setEditKeyword] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [aiInstructions, setAiInstructions] = useState("");
  const [improving, setImproving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const hasWp = !!(activeClient?.wpUrl && activeClient?.wpUsername && activeClient?.wpAppPassword);

  async function loadPages() {
    if (!hasWp) return;
    setLoadingPages(true); setError(null);
    try {
      const res = await fetch("/api/wordpress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wpUrl: activeClient!.wpUrl,
          wpUsername: activeClient!.wpUsername,
          wpAppPassword: activeClient!.wpAppPassword,
          endpoint: "pages?per_page=100&context=edit&_fields=id,title,slug,link,status,content,meta",
          apiNamespace: "wp/v2",
          method: "GET",
        }),
      });
      const json = await res.json();
      const data: Array<Record<string, unknown>> = json._data || json;
      if (Array.isArray(data)) {
        setPages(data.map(p => ({
          id: p.id as number,
          title: ((p.title as { rendered?: string })?.rendered || String(p.title || "(sin título)")),
          slug: String(p.slug || ""),
          link: String(p.link || ""),
          status: String(p.status || ""),
          content: ((p.content as { raw?: string })?.raw || String((p.content as { rendered?: string })?.rendered || "")),
          seoTitle: String((p.meta as Record<string, string>)?.rank_math_title || ""),
          metaDescription: String((p.meta as Record<string, string>)?.rank_math_description || ""),
          focusKeyword: String((p.meta as Record<string, string>)?.rank_math_focus_keyword || ""),
        })));
      }
    } catch (err) {
      setError(String(err));
    } finally { setLoadingPages(false); }
  }

  function selectPage(page: WpPage) {
    setSelected(page);
    setEditContent(page.content);
    setEditSeoTitle(page.seoTitle);
    setEditMetaDesc(page.metaDescription);
    setEditKeyword(page.focusKeyword);
    setEditSlug(page.slug);
    setSaveMsg(""); setError(null); setShowPreview(false);
  }

  async function improveWithAI() {
    if (!selected || !aiInstructions.trim()) return;
    setImproving(true); setError(null);
    try {
      const res = await fetch("/api/websites/improve-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selected.title,
          content: editContent,
          currentSeoTitle: editSeoTitle,
          currentMetaDesc: editMetaDesc,
          currentKeyword: editKeyword,
          instructions: aiInstructions,
          clientName: activeClient?.name,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.content) setEditContent(data.content);
      if (data.seoTitle) setEditSeoTitle(data.seoTitle.slice(0, 60));
      if (data.metaDescription) setEditMetaDesc(data.metaDescription.slice(0, 160));
      if (data.focusKeyword) setEditKeyword(data.focusKeyword);
    } catch (err) {
      setError(String(err));
    } finally { setImproving(false); }
  }

  async function savePage() {
    if (!selected || !hasWp) return;
    setSaving(true); setSaveMsg(""); setError(null);
    try {
      const res = await fetch("/api/wordpress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wpUrl: activeClient!.wpUrl,
          wpUsername: activeClient!.wpUsername,
          wpAppPassword: activeClient!.wpAppPassword,
          endpoint: `pages/${selected.id}`,
          apiNamespace: "wp/v2",
          method: "POST",
          body: {
            content: editContent,
            slug: editSlug,
            meta: {
              rank_math_title: editSeoTitle.slice(0, 60),
              rank_math_description: editMetaDesc.slice(0, 160),
              rank_math_focus_keyword: editKeyword,
              rank_math_og_title: editSeoTitle.slice(0, 60),
              rank_math_og_description: editMetaDesc.slice(0, 160),
              rank_math_twitter_title: editSeoTitle.slice(0, 60),
              rank_math_twitter_description: editMetaDesc.slice(0, 160),
            },
          },
        }),
      });
      const json = await res.json();
      const result = json._data || json;
      if (result.id || result.slug) {
        setSaveMsg("✓ Guardado en WordPress con SEO RankMath");
        setPages(prev => prev.map(p => p.id === selected.id ? {
          ...p, content: editContent, slug: editSlug,
          seoTitle: editSeoTitle, metaDescription: editMetaDesc, focusKeyword: editKeyword,
        } : p));
        setTimeout(() => setSaveMsg(""), 3000);
      } else {
        throw new Error(result.error || "Error al guardar");
      }
    } catch (err) {
      setError(String(err));
    } finally { setSaving(false); }
  }

  if (!activeClient) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header title="Editor de Páginas IA" subtitle="Edita y optimiza páginas de WordPress con IA" />
        <main className="flex-1 p-6">
          <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <AlertCircle size={20} className="text-yellow-600" />
            <p className="text-sm text-yellow-700">Selecciona un cliente activo primero.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header title="Editor de Páginas IA" subtitle="Edita y optimiza páginas WordPress con IA para SEO RankMath" />
      <main className="flex-1 p-4 md:p-6">

        {error && (
          <div className="flex items-center gap-3 p-4 mb-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Page list */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-sm">Páginas WordPress</h2>
              <button onClick={loadPages} disabled={loadingPages || !hasWp}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-black disabled:opacity-50"
                style={{ backgroundColor: "#FFC207" }}>
                {loadingPages ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                Cargar
              </button>
            </div>
            {!hasWp && (
              <div className="p-4">
                <p className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-lg p-3">WordPress no configurado en este cliente.</p>
              </div>
            )}
            {pages.length === 0 && hasWp && !loadingPages && (
              <div className="p-6 text-center">
                <Globe size={32} className="mx-auto mb-2 text-gray-200" />
                <p className="text-sm text-gray-400">Haz click en "Cargar" para ver las páginas.</p>
              </div>
            )}
            <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
              {pages.map(page => (
                <button key={page.id} onClick={() => selectPage(page)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${selected?.id === page.id ? "bg-yellow-50 border-l-2 border-yellow-400" : ""}`}>
                  <p className="text-sm font-medium text-gray-800 truncate">{page.title}</p>
                  <p className="text-xs text-gray-400 font-mono truncate">/{page.slug}</p>
                  {page.focusKeyword && (
                    <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full mt-1 inline-block">{page.focusKeyword}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Editor */}
          <div className="lg:col-span-2 space-y-4">
            {!selected ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <Pencil size={40} className="mx-auto mb-3 text-gray-200" />
                <p className="text-gray-400">Selecciona una página de la lista para editarla</p>
              </div>
            ) : (
              <>
                {/* Page header */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-gray-900 truncate">{selected.title}</h2>
                    <p className="text-xs text-gray-400 font-mono">/{selected.slug}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a href={selected.link} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200">
                      <ExternalLink size={13} className="text-gray-500" />
                    </a>
                    <button onClick={savePage} disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-black disabled:opacity-50"
                      style={{ backgroundColor: "#FFC207" }}>
                      {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                      {saving ? "Guardando..." : "Guardar en WP"}
                    </button>
                  </div>
                </div>

                {saveMsg && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle2 size={15} className="text-green-600" />
                    <p className="text-sm text-green-700">{saveMsg}</p>
                  </div>
                )}

                {/* SEO Fields */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                  <h3 className="font-semibold text-gray-900 text-sm">SEO — RankMath</h3>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Keyword objetivo
                    </label>
                    <input value={editKeyword} onChange={e => setEditKeyword(e.target.value)}
                      placeholder="Ej: servicios de marketing digital"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Título SEO ({editSeoTitle.length}/60) {editSeoTitle.length > 60 && <span className="text-red-500">— demasiado largo</span>}
                    </label>
                    <input value={editSeoTitle} onChange={e => setEditSeoTitle(e.target.value)} maxLength={60}
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 ${editSeoTitle.length > 60 ? "border-red-300" : "border-gray-200"}`} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Meta descripción ({editMetaDesc.length}/160) {editMetaDesc.length > 160 && <span className="text-red-500">— demasiado larga</span>}
                    </label>
                    <textarea value={editMetaDesc} onChange={e => setEditMetaDesc(e.target.value)} maxLength={160} rows={2}
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none ${editMetaDesc.length > 160 ? "border-red-300" : "border-gray-200"}`} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Enlace permanente (slug)</label>
                    <input value={editSlug} onChange={e => setEditSlug(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                  </div>
                </div>

                {/* AI improvement */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                  <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                    <Sparkles size={14} style={{ color: "#b8860b" }} />Mejorar con IA
                  </h3>
                  <textarea value={aiInstructions} onChange={e => setAiInstructions(e.target.value)} rows={2}
                    placeholder="Ej: Mejora el contenido para posicionar 'servicios de marketing en Santiago'. Hazlo más persuasivo con CTA al final."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none" />
                  <button onClick={improveWithAI} disabled={improving || !aiInstructions.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-black disabled:opacity-50"
                    style={{ backgroundColor: "#FFC207" }}>
                    {improving ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    {improving ? "Mejorando..." : "Mejorar contenido y SEO"}
                  </button>
                </div>

                {/* Content editor */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900 text-sm">Contenido HTML</h3>
                    <button onClick={() => setShowPreview(v => !v)}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700">
                      {showPreview ? <EyeOff size={13} /> : <Eye size={13} />}
                      {showPreview ? "Editar" : "Vista previa"}
                    </button>
                  </div>
                  {showPreview ? (
                    <div className="p-4 prose prose-sm max-w-none overflow-y-auto max-h-[400px]"
                      dangerouslySetInnerHTML={{ __html: editContent }} />
                  ) : (
                    <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
                      rows={16} className="w-full px-4 py-3 text-xs font-mono focus:outline-none resize-none"
                      placeholder="Contenido HTML de la página..." />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
