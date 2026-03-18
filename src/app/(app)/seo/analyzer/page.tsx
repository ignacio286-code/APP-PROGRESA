"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { useClient } from "@/lib/client-context";
import {
  Search, AlertCircle, CheckCircle2, XCircle, Loader2,
  TrendingUp, FileText, Image, Link2, Type,
} from "lucide-react";

interface SeoResult {
  url: string;
  title: string;
  metaDescription: string;
  h1: string[];
  h2: string[];
  images: { src: string; alt: string }[];
  wordCount: number;
  issues: string[];
  score: number;
}

function ScoreCircle({ score }: { score: number }) {
  const color = score >= 80 ? "#22c55e" : score >= 50 ? "#FFC207" : "#ef4444";
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg width="96" height="96" className="-rotate-90">
        <circle cx="48" cy="48" r="40" fill="none" stroke="#f3f4f6" strokeWidth="8" />
        <circle
          cx="48" cy="48" r="40"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-2xl font-bold" style={{ color }}>{score}</p>
        <p className="text-xs text-gray-400">/ 100</p>
      </div>
    </div>
  );
}

export default function SeoAnalyzerPage() {
  const { activeClient } = useClient();
  const [url, setUrl] = useState(activeClient?.website || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SeoResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    if (!url) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/seo/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
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

  return (
    <div>
      <Header title="Analizador SEO" subtitle="Auditoría on-page y recomendaciones" />

      <div className="p-6 space-y-6">
        {/* URL Input */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">URL a analizar</p>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Link2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && analyze()}
                className="w-full border border-gray-200 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="https://ejemplo.com/pagina"
              />
            </div>
            <button
              onClick={analyze}
              disabled={loading || !url}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "#FFC207" }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              Analizar
            </button>
          </div>
          {activeClient?.website && (
            <div className="flex flex-wrap gap-2 mt-3">
              <p className="text-xs text-gray-400 mr-1">Rápido:</p>
              <button
                onClick={() => setUrl(activeClient.website!)}
                className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
              >
                {activeClient.website}
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <XCircle size={20} className="text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
            <Loader2 size={32} className="animate-spin text-yellow-500 mb-3" />
            <p className="text-gray-500 text-sm">Analizando la página...</p>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {/* Score card */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-6">
              <ScoreCircle score={result.score} />
              <div>
                <h3 className="font-bold text-gray-900 text-lg">
                  {result.score >= 80 ? "Buena optimización" : result.score >= 50 ? "Optimización regular" : "Necesita mejoras"}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">{result.url}</p>
                <p className="text-sm text-gray-400 mt-1">{result.issues.length} problemas encontrados · {result.wordCount} palabras</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Issues */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <AlertCircle size={16} className="text-orange-500" />
                  Problemas encontrados
                </h3>
                {result.issues.length === 0 ? (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle2 size={16} />
                    Excelente — no se encontraron problemas
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {result.issues.map((issue, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <XCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
                        <span className="text-gray-700">{issue}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Meta info */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Type size={16} className="text-blue-500" />
                  Metadatos
                </h3>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Título ({result.title.length} chars)</p>
                  <p className="text-sm font-medium text-gray-900 bg-gray-50 rounded-lg p-2">{result.title || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Meta descripción ({result.metaDescription.length} chars)</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-2">{result.metaDescription || "—"}</p>
                </div>
              </div>

              {/* H1/H2 */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <TrendingUp size={16} className="text-purple-500" />
                  Estructura de headings
                </h3>
                {result.h1.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-400 mb-1">H1</p>
                    {result.h1.map((h, i) => (
                      <p key={i} className="text-sm font-semibold text-gray-900 bg-purple-50 rounded-lg p-2 mb-1">{h}</p>
                    ))}
                  </div>
                )}
                {result.h2.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">H2 ({result.h2.length})</p>
                    <ul className="space-y-1">
                      {result.h2.slice(0, 5).map((h, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                          <span className="text-gray-400">—</span>{h}
                        </li>
                      ))}
                      {result.h2.length > 5 && (
                        <li className="text-xs text-gray-400">+{result.h2.length - 5} más</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* Images */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Image size={16} className="text-green-500" />
                  Imágenes ({result.images.length})
                </h3>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {result.images.map((img, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {img.alt ? (
                        <CheckCircle2 size={12} className="text-green-500 shrink-0" />
                      ) : (
                        <XCircle size={12} className="text-red-400 shrink-0" />
                      )}
                      <span className="text-gray-500 truncate">{img.src.split("/").pop()}</span>
                      {!img.alt && <span className="text-red-400 shrink-0">sin alt</span>}
                    </div>
                  ))}
                  {result.images.length === 0 && (
                    <p className="text-sm text-gray-400">No se encontraron imágenes</p>
                  )}
                </div>
              </div>

              {/* Content stats */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <FileText size={16} className="text-blue-500" />
                  Estadísticas de contenido
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: "Palabras", value: result.wordCount, ok: result.wordCount >= 300 },
                    { label: "Imágenes", value: result.images.length, ok: result.images.length > 0 },
                    { label: "H2 headings", value: result.h2.length, ok: result.h2.length >= 2 },
                    { label: "Problemas", value: result.issues.length, ok: result.issues.length === 0 },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center p-3 bg-gray-50 rounded-xl">
                      <p className={`text-2xl font-bold ${stat.ok ? "text-green-600" : "text-orange-500"}`}>{stat.value}</p>
                      <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
