"use client";

import { useState, useRef } from "react";
import Header from "@/components/Header";
import { useClient } from "@/lib/client-context";
import {
  Camera, Upload, Loader2, Video, Download, Mic, Play, AlertCircle, User,
} from "lucide-react";

export default function ContentAvatarPage() {
  const { activeClient } = useClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [script, setScript] = useState("");
  const [voice, setVoice] = useState("es-ES-Alvaro");
  const [generating, setGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function generateAvatar() {
    if (!imageFile || !script.trim()) return;
    setGenerating(true);
    setError(null);
    setProgress(0);
    setVideoUrl(null);

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 10, 90));
    }, 1500);

    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("script", script);
      formData.append("voice", voice);
      if (activeClient?.id) formData.append("clientId", activeClient.id);

      const res = await fetch("/api/content/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      clearInterval(interval);
      setProgress(100);

      if (data.error) throw new Error(data.error);
      setVideoUrl(data.url || null);
    } catch (err) {
      clearInterval(interval);
      setError(String(err));
    } finally {
      setGenerating(false);
    }
  }

  const voices = [
    { id: "es-ES-Alvaro", label: "Álvaro (España, masculino)" },
    { id: "es-ES-Elvira", label: "Elvira (España, femenino)" },
    { id: "es-MX-Dalia", label: "Dalia (México, femenino)" },
    { id: "es-MX-Jorge", label: "Jorge (México, masculino)" },
    { id: "es-CO-Salome", label: "Salomé (Colombia, femenino)" },
  ];

  return (
    <div>
      <Header title="Avatar con Rostro" subtitle="Genera videos con tu rostro protagonizando el mensaje" />

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Step 1: Photo */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-black text-xs font-bold" style={{ backgroundColor: "#FFC207" }}>1</div>
              <h3 className="text-sm font-semibold text-gray-700">Foto del rostro</h3>
            </div>

            {imagePreview ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Preview" className="w-full aspect-square object-cover rounded-xl" />
                <button
                  onClick={() => { setImagePreview(null); setImageFile(null); }}
                  className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-lg hover:bg-black/70"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-yellow-400 transition-colors"
                >
                  <User size={40} className="text-gray-300 mb-2" />
                  <p className="text-sm text-gray-400">Subir foto</p>
                  <p className="text-xs text-gray-300 mt-0.5">JPG, PNG · Max 10MB</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    <Upload size={14} /> Subir
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    <Camera size={14} /> Cámara
                  </button>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs text-amber-700 font-semibold mb-1">Mejores resultados:</p>
              <ul className="text-xs text-amber-600 space-y-0.5">
                <li>· Foto frontal, buena iluminación</li>
                <li>· Fondo neutro o blanco</li>
                <li>· Resolución mínima 512x512px</li>
                <li>· Expresión neutral o sonrisa</li>
              </ul>
            </div>
          </div>

          {/* Step 2: Script */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-black text-xs font-bold" style={{ backgroundColor: "#FFC207" }}>2</div>
              <h3 className="text-sm font-semibold text-gray-700">Guion del mensaje</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Texto a pronunciar *</label>
                <textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  rows={8}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                  placeholder="Escribe aquí el mensaje que pronunciará el avatar...

ej: Hola, soy María de TechStore. Hoy tenemos una oferta increíble: 50% de descuento en toda nuestra línea de laptops. ¡No te lo pierdas, oferta válida solo por hoy!"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{script.length} caracteres</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                  <Mic size={14} /> Voz
                </label>
                <select
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  {voices.map((v) => (
                    <option key={v.id} value={v.id}>{v.label}</option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-xs text-blue-700">
                  <strong>Powered by:</strong> D-ID / HeyGen para generación de avatar lip-sync.
                  Requiere API key configurada en el servidor.
                </p>
              </div>
            </div>
          </div>

          {/* Step 3: Generate & Result */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-black text-xs font-bold" style={{ backgroundColor: "#FFC207" }}>3</div>
                <h3 className="text-sm font-semibold text-gray-700">Generar video</h3>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4">
                  <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              )}

              {generating && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Procesando avatar...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%`, backgroundColor: "#FFC207" }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Esto puede tardar 2-5 minutos dependiendo de la duración</p>
                </div>
              )}

              <button
                onClick={generateAvatar}
                disabled={generating || !imageFile || !script.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#FFC207" }}
              >
                {generating ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                {generating ? "Generando..." : "Crear video avatar"}
              </button>

              {(!imageFile || !script.trim()) && (
                <p className="text-xs text-gray-400 text-center mt-2">
                  {!imageFile ? "Sube una foto" : "Escribe el guion"} para continuar
                </p>
              )}
            </div>

            {/* Video result */}
            {videoUrl ? (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Video generado</h3>
                <video controls className="w-full rounded-xl mb-3">
                  <source src={videoUrl} />
                </video>
                <a
                  href={videoUrl}
                  download
                  className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm font-semibold text-black"
                  style={{ backgroundColor: "#FFC207" }}
                >
                  <Download size={14} /> Descargar video
                </a>
              </div>
            ) : !generating ? (
              <div className="bg-white rounded-xl border border-dashed border-gray-200 p-5 flex flex-col items-center justify-center h-40">
                <Video size={28} className="text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">El video aparecerá aquí</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
