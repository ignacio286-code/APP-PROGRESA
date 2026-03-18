"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { useClient } from "@/lib/client-context";
import {
  Cpu, AlertCircle, Loader2, Send, Copy, Check,
  FileText, ShoppingBag, RefreshCw,
} from "lucide-react";

interface GeneratedContent {
  title?: string;
  metaTitle?: string;
  metaDescription?: string;
  content?: string;
  shortDescription?: string;
  longDescription?: string;
  slug?: string;
  excerpt?: string;
  tags?: string[];
  raw?: string;
}

export default function SeoContentPage() {
  const { activeClient } = useClient();
  const [type, setType] = useState<"article" | "product">("article");
  const [keyword, setKeyword] = useState("");
  const [title, setTitle] = useState("");
  const [tone, setTone] = useState("profesional");
  const [wordCount, setWordCount] = useState(800);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState("");

  async function generate() {
    if (!keyword.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/seo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          keyword,
          title,
          tone,
          wordCount,
          clientName: activeClient?.name,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function publishToWordPress(status: "publish" | "draft") {
    if (!result || !activeClient?.wpUrl) return;
    setPublishing(true);
    setPublishMsg("");
    try {
      const body: Record<string, string> = {
        title: result.title || keyword,
        status,
        content: result.content || result.longDescription || "",
        excerpt: result.excerpt || result.shortDescription || "",
      };
      const endpoint = type === "product" ? "products" : "posts";
      const res = await fetch("/api/wordpress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wpUrl: activeClient.wpUrl,
          wpUsername: activeClient.wpUsername,
          wpAppPassword: activeClient.wpAppPassword,
          endpoint,
          method: "POST",
          body,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPublishMsg(status === "publish" ? "Publicado en WordPress" : "Guardado como borrador en WordPress");
    } catch (err) {
      setPublishMsg("Error: " + String(err));
    } finally {
      setPublishing(false);
    }
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div>
      <Header title="Generador de Contenido SEO" subtitle="Artículos y descripciones optimizadas con IA" />

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left panel - controls */}
          <div className="lg:col-span-2 space-y-4">
            {!activeClient && (
              <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                <AlertCircle size={16} className="text-yellow-600 shrink-0" />
                <p className="text-xs text-yellow-700">Selecciona un cliente activo para publicar directamente en WordPress.</p>
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              {/* Type */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Tipo de contenido</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: "article", label: "Artículo / Blog", icon: FileText },
                    { val: "product", label: "Producto", icon: ShoppingBag },
                  ].map(({ val, label, icon: Icon }) => (
                    <button
                      key={val}
                      onClick={() => setType(val as "article" | "product")}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                        type === val
                          ? "border-yellow-400 text-black"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                      style={type === val ? { backgroundColor: "#FFC20720" } : {}}
                    >
                      <Icon size={14} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Keyword */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Palabra clave principal *</label>
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="ej: zapatos deportivos para correr"
                />
              </div>

              {/* Title suggestion */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título sugerido (opcional)</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="La IA generará uno si lo dejas vacío"
                />
              </div>

              {/* Tone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tono</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  {["profesional", "amigable", "persuasivo", "informativo", "urgente", "aspiracional"].map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>

              {/* Word count */}
              {type === "article" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Extensión (~{wordCount} palabras)</label>
                  <input
                    type="range"
                    min={400}
                    max={2000}
                    step={100}
                    value={wordCount}
                    onChange={(e) => setWordCount(Number(e.target.value))}
                    className="w-full accent-yellow-400"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>400</span><span>2000</span>
                  </div>
                </div>
              )}

              <button
                onClick={generate}
                disabled={loading || !keyword.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#FFC207" }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Cpu size={16} />}
                {loading ? "Generando con IA..." : "Generar contenido"}
              </button>
            </div>
          </div>

          {/* Right panel - result */}
          <div className="lg:col-span-3">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-4">{error}</div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-gray-200">
                <Loader2 size={32} className="animate-spin text-yellow-500 mb-3" />
                <p className="text-gray-500 text-sm">La IA está escribiendo tu contenido...</p>
                <p className="text-xs text-gray-400 mt-1">Esto puede tardar unos segundos</p>
              </div>
            )}

            {result && !loading && (
              <div className="space-y-4">
                {/* Meta info */}
                {(result.metaTitle || result.metaDescription) && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700">Metadatos SEO</h3>
                    {result.metaTitle && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-gray-400">Meta título ({result.metaTitle.length} chars)</p>
                          <button onClick={() => copy(result.metaTitle!, "metaTitle")} className="text-gray-400 hover:text-gray-600">
                            {copied === "metaTitle" ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                          </button>
                        </div>
                        <p className="text-sm font-medium text-gray-900 bg-gray-50 p-2 rounded-lg">{result.metaTitle}</p>
                      </div>
                    )}
                    {result.metaDescription && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-gray-400">Meta descripción ({result.metaDescription.length} chars)</p>
                          <button onClick={() => copy(result.metaDescription!, "metaDesc")} className="text-gray-400 hover:text-gray-600">
                            {copied === "metaDesc" ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                          </button>
                        </div>
                        <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded-lg">{result.metaDescription}</p>
                      </div>
                    )}
                    {result.tags && result.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {result.tags.map((tag) => (
                          <span key={tag} className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">
                      {result.title || (type === "article" ? "Artículo generado" : "Descripción de producto")}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copy(result.content || result.longDescription || "", "content")}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
                      >
                        {copied === "content" ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                        Copiar
                      </button>
                      <button
                        onClick={generate}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
                      >
                        <RefreshCw size={12} />
                        Regenerar
                      </button>
                    </div>
                  </div>
                  {result.shortDescription && (
                    <p className="text-sm text-gray-600 italic bg-blue-50 p-3 rounded-lg mb-3">{result.shortDescription}</p>
                  )}
                  <div
                    className="prose prose-sm max-w-none text-gray-700 text-sm"
                    dangerouslySetInnerHTML={{
                      __html: (result.content || result.longDescription || "").replace(/\n/g, "<br/>"),
                    }}
                  />
                </div>

                {/* Publish to WP */}
                {activeClient?.wpUrl && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Publicar en WordPress</h3>
                    {publishMsg && (
                      <p className={`text-sm mb-3 font-medium ${publishMsg.includes("Error") ? "text-red-600" : "text-green-600"}`}>
                        {publishMsg}
                      </p>
                    )}
                    <div className="flex gap-3">
                      <button
                        onClick={() => publishToWordPress("draft")}
                        disabled={publishing}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {publishing ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                        Guardar borrador
                      </button>
                      <button
                        onClick={() => publishToWordPress("publish")}
                        disabled={publishing}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
                        style={{ backgroundColor: "#FFC207" }}
                      >
                        {publishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        Publicar ahora
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!result && !loading && (
              <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-dashed border-gray-200">
                <Cpu size={32} className="text-gray-300 mb-3" />
                <p className="text-gray-400 text-sm">El contenido generado aparecerá aquí</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
