"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { useClient } from "@/lib/client-context";
import { Video, Loader2, Download, Play, Palette, Type, Wand2 } from "lucide-react";

const TEMPLATES = [
  { id: "story", label: "Story / Reels", size: "9:16 (1080x1920)", icon: "📱" },
  { id: "feed", label: "Feed cuadrado", size: "1:1 (1080x1080)", icon: "⬛" },
  { id: "banner", label: "Banner horizontal", size: "16:9 (1920x1080)", icon: "🖥️" },
  { id: "square_ad", label: "Anuncio cuadrado", size: "1:1 con borde", icon: "🎯" },
];

interface VideoConfig {
  template: string;
  headline: string;
  subtext: string;
  cta: string;
  primaryColor: string;
  textColor: string;
  duration: number;
}

const DEFAULT_CONFIG: VideoConfig = {
  template: "story",
  headline: "",
  subtext: "",
  cta: "¡Compra ahora!",
  primaryColor: "#FFC207",
  textColor: "#000000",
  duration: 10,
};

export default function ContentVideosPage() {
  const { activeClient } = useClient();
  const [config, setConfig] = useState<VideoConfig>(DEFAULT_CONFIG);
  const [generating, setGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateConfig(key: keyof VideoConfig, value: string | number) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  async function generateVideo() {
    if (!config.headline.trim()) return;
    setGenerating(true);
    setError(null);
    setVideoUrl(null);
    try {
      const res = await fetch("/api/content/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...config, clientName: activeClient?.name }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setVideoUrl(data.url || null);
    } catch (err) {
      setError(String(err));
    } finally {
      setGenerating(false);
    }
  }

  const selectedTemplate = TEMPLATES.find((t) => t.id === config.template) || TEMPLATES[0];

  return (
    <div>
      <Header title="Generador de Videos" subtitle="Crea videos para campañas con Remotion" />

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Config panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Plantilla</h3>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => updateConfig("template", t.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      config.template === t.id ? "border-yellow-400" : "border-gray-200 hover:bg-gray-50"
                    }`}
                    style={config.template === t.id ? { backgroundColor: "#FFC20715" } : {}}
                  >
                    <p className="text-lg mb-1">{t.icon}</p>
                    <p className="text-xs font-semibold text-gray-900">{t.label}</p>
                    <p className="text-xs text-gray-400">{t.size}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Type size={14} /> Textos
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titular principal *</label>
                <input
                  value={config.headline}
                  onChange={(e) => updateConfig("headline", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="ej: 50% de descuento HOY"
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtexto</label>
                <input
                  value={config.subtext}
                  onChange={(e) => updateConfig("subtext", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="ej: Solo por tiempo limitado"
                  maxLength={80}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CTA (botón)</label>
                <input
                  value={config.cta}
                  onChange={(e) => updateConfig("cta", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="ej: Ver oferta"
                  maxLength={30}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Palette size={14} /> Diseño
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Color principal</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.primaryColor}
                      onChange={(e) => updateConfig("primaryColor", e.target.value)}
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                    />
                    <span className="text-xs text-gray-500 font-mono">{config.primaryColor}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Color de texto</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.textColor}
                      onChange={(e) => updateConfig("textColor", e.target.value)}
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                    />
                    <span className="text-xs text-gray-500 font-mono">{config.textColor}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duración ({config.duration}s)</label>
                <input
                  type="range"
                  min={5}
                  max={30}
                  value={config.duration}
                  onChange={(e) => updateConfig("duration", Number(e.target.value))}
                  className="w-full accent-yellow-400"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>5s</span><span>30s</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
            )}

            <button
              onClick={generateVideo}
              disabled={generating || !config.headline.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "#FFC207" }}
            >
              {generating ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
              {generating ? "Generando video..." : "Generar video"}
            </button>
          </div>

          {/* Preview */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Vista previa</h3>

              {/* Live preview */}
              <div className="flex justify-center">
                <div
                  className={`relative flex flex-col items-center justify-center rounded-xl overflow-hidden ${
                    config.template === "story" ? "w-40 h-72" :
                    config.template === "banner" ? "w-full h-40" : "w-64 h-64"
                  }`}
                  style={{ backgroundColor: config.primaryColor }}
                >
                  {activeClient?.logoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={activeClient.logoUrl} alt="Logo" className="w-12 h-12 object-contain mb-3 rounded" />
                  )}
                  <div className="text-center px-4">
                    <p
                      className="font-bold text-xl leading-tight mb-1"
                      style={{ color: config.textColor }}
                    >
                      {config.headline || "Tu titular aquí"}
                    </p>
                    {config.subtext && (
                      <p className="text-sm opacity-80" style={{ color: config.textColor }}>
                        {config.subtext}
                      </p>
                    )}
                  </div>
                  {config.cta && (
                    <div
                      className="mt-4 px-4 py-2 rounded-full text-sm font-bold"
                      style={{ backgroundColor: config.textColor, color: config.primaryColor }}
                    >
                      {config.cta}
                    </div>
                  )}
                  <p className="absolute bottom-2 right-2 text-xs opacity-50" style={{ color: config.textColor }}>
                    {config.duration}s
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-400 text-center mt-3">
                {selectedTemplate.label} · {selectedTemplate.size}
              </p>
            </div>

            {/* Generated video */}
            {videoUrl ? (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Video generado</h3>
                <video controls className="w-full rounded-xl">
                  <source src={videoUrl} />
                </video>
                <div className="flex gap-3 mt-3">
                  <a
                    href={videoUrl}
                    download
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-black"
                    style={{ backgroundColor: "#FFC207" }}
                  >
                    <Download size={14} /> Descargar video
                  </a>
                </div>
              </div>
            ) : generating ? (
              <div className="flex flex-col items-center justify-center h-40 bg-white rounded-xl border border-gray-200">
                <Loader2 size={28} className="animate-spin text-yellow-500 mb-2" />
                <p className="text-sm text-gray-500">Renderizando video con Remotion...</p>
                <p className="text-xs text-gray-400 mt-1">Esto puede tardar 1-2 minutos</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 bg-white rounded-xl border border-dashed border-gray-200">
                <Video size={28} className="text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">El video exportado aparecerá aquí</p>
                <p className="text-xs text-gray-300 mt-1">Formatos: MP4 compatible con Meta y Google</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
