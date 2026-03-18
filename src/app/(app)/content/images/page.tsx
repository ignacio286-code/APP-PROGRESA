"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { useClient } from "@/lib/client-context";
import { Image, Loader2, Download, Trash2, AlertCircle, Wand2 } from "lucide-react";

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  style: string;
  size: string;
  createdAt: string;
}

const SIZES = ["1024x1024", "1792x1024", "1024x1792"];
const STYLES = [
  "Fotografía realista",
  "Ilustración moderna",
  "Minimalista",
  "Publicitario corporativo",
  "Artístico abstracto",
  "Retro / Vintage",
  "3D render",
  "Animado / cartoon",
];

export default function ContentImagesPage() {
  const { activeClient } = useClient();
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Fotografía realista");
  const [size, setSize] = useState("1024x1024");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<GeneratedImage[]>([]);

  const hasNanobana = !!activeClient?.nanobanaApiKey;

  async function generate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/content/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          style,
          size,
          apiKey: activeClient?.nanobanaApiKey,
          clientId: activeClient?.id,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: data.url || data.imageUrl || data.data?.[0]?.url || "",
        prompt,
        style,
        size,
        createdAt: new Date().toISOString(),
      };
      setImages((prev) => [newImage, ...prev]);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Header title="Generador de Imágenes" subtitle="Crea imágenes para tus campañas con IA" />

      <div className="p-6 space-y-6">
        {!activeClient?.nanobanaApiKey && (
          <div className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-200 rounded-xl">
            <AlertCircle size={20} className="text-purple-600 shrink-0" />
            <div>
              <p className="text-sm text-purple-700 font-medium">API Key de Nanobana no configurada</p>
              <p className="text-xs text-purple-600 mt-0.5">
                Ve a Gestión de Clientes → edita el cliente → sección Otras integraciones → agrega tu Nanobana API Key.
                Las imágenes se generarán con una demo hasta que configures la clave.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Controls */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Configuración</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prompt / Descripción *</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                  placeholder="ej: Mujer joven usando laptop en café moderno, luz natural, estilo corporativo, fondo blanco..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estilo</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {STYLES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStyle(s)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-all text-left ${
                        style === s ? "text-black border-yellow-400" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                      style={style === s ? { backgroundColor: "#FFC20720" } : {}}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tamaño</label>
                <div className="flex gap-2">
                  {SIZES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                        size === s ? "text-black border-yellow-400" : "border-gray-200 text-gray-600"
                      }`}
                      style={size === s ? { backgroundColor: "#FFC20720" } : {}}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>
              )}

              <button
                onClick={generate}
                disabled={loading || !prompt.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#FFC207" }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                {loading ? "Generando imagen..." : "Generar imagen"}
              </button>

              {!hasNanobana && (
                <p className="text-xs text-gray-400 text-center">Sin API key: se generará un placeholder</p>
              )}
            </div>
          </div>

          {/* Gallery */}
          <div className="lg:col-span-3">
            {images.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-dashed border-gray-200">
                <Image size={32} className="text-gray-300 mb-3" />
                <p className="text-gray-400 text-sm">Las imágenes generadas aparecerán aquí</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {loading && (
                  <div className="col-span-2 flex flex-col items-center justify-center h-48 bg-white rounded-xl border border-gray-200">
                    <Loader2 size={32} className="animate-spin text-yellow-500 mb-3" />
                    <p className="text-gray-500 text-sm">Generando imagen con IA...</p>
                  </div>
                )}
                {images.map((img) => (
                  <div key={img.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="aspect-square bg-gray-100 relative">
                      {img.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img.url} alt={img.prompt} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image size={40} className="text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-gray-600 truncate mb-1">{img.prompt}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">{img.style} · {img.size}</span>
                        <div className="flex gap-1.5">
                          {img.url && (
                            <a
                              href={img.url}
                              download
                              className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                              <Download size={12} className="text-gray-500" />
                            </a>
                          )}
                          <button
                            onClick={() => setImages((prev) => prev.filter((i) => i.id !== img.id))}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
                          >
                            <Trash2 size={12} className="text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
