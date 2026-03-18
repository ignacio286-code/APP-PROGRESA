"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { useClient } from "@/lib/client-context";
import { AlertCircle, Loader2, Cpu, Send, Eye, CheckCircle2, ChevronRight } from "lucide-react";
import Link from "next/link";

interface CampaignPlan {
  campaignName: string;
  objective: string;
  audience: {
    ageMin: number;
    ageMax: number;
    gender: string;
    interests: string[];
    locations: string[];
  };
  budget: { daily: number; currency: string; duration: number };
  adCopy: {
    headline: string;
    primaryText: string;
    description: string;
    cta: string;
  };
  placements: string[];
  estimatedReach: string;
}

const OBJECTIVES = [
  "Tráfico al sitio web",
  "Conversiones",
  "Reconocimiento de marca",
  "Alcance",
  "Generación de leads",
  "Mensajes",
  "Ventas del catálogo",
];

export default function MetaCampaignPage() {
  const { activeClient } = useClient();
  const [goal, setGoal] = useState("");
  const [product, setProduct] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [budget, setBudget] = useState("20");
  const [duration, setDuration] = useState("14");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<CampaignPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<string | null>(null);

  const hasMetaConfig = !!(activeClient?.metaAccessToken && activeClient?.metaAdAccountId);

  async function generate() {
    if (!goal || !product) return;
    setLoading(true);
    setError(null);
    setPlan(null);

    try {
      const res = await fetch("/api/paid-media/meta/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: activeClient?.name || "mi empresa",
          goal,
          product,
          targetAudience,
          dailyBudget: budget,
          duration,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPlan(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function publishCampaign() {
    if (!plan || !activeClient?.metaAccessToken) return;
    setPublishing(true);
    setPublishResult(null);
    try {
      const res = await fetch("/api/paid-media/meta/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, client: activeClient }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPublishResult(`Campaña creada: ID ${data.campaignId || "generado"}`);
    } catch (err) {
      setPublishResult("Error: " + String(err));
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div>
      <Header title="Creador de Campañas Meta" subtitle="La IA genera tu campaña completa para Facebook e Instagram" />

      <div className="p-6">
        {!activeClient ? (
          <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl mb-6">
            <AlertCircle size={20} className="text-yellow-600 shrink-0" />
            <p className="text-sm text-yellow-700">Selecciona un cliente activo para comenzar.</p>
          </div>
        ) : !hasMetaConfig ? (
          <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-blue-600 shrink-0" />
              <p className="text-sm text-blue-700">
                <strong>{activeClient.name}</strong> no tiene Meta Business configurado.
              </p>
            </div>
            <Link
              href="/paid-media/connections"
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg text-white bg-blue-600"
            >
              Configurar <ChevronRight size={12} />
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl mb-6">
            <CheckCircle2 size={16} className="text-green-500" />
            <p className="text-sm text-green-700">Meta Business conectado — cuenta <code className="bg-green-100 px-1 rounded">{activeClient.metaAdAccountId}</code></p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Parámetros de la campaña</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo *</label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="">Selecciona un objetivo</option>
                  {OBJECTIVES.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Producto / Servicio *</label>
                <input
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="ej: Curso online de programación"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Audiencia objetivo</label>
                <textarea
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                  placeholder="ej: Emprendedores 25-45 años, interesados en tecnología y startups, Colombia y México"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Presupuesto diario ($)</label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    min="5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duración (días)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    min="1"
                  />
                </div>
              </div>

              <button
                onClick={generate}
                disabled={loading || !goal || !product}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#FFC207" }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Cpu size={16} />}
                {loading ? "Generando campaña..." : "Generar con IA"}
              </button>
            </div>
          </div>

          {/* Campaign plan */}
          <div className="lg:col-span-3">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-4">{error}</div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-gray-200">
                <Loader2 size={32} className="animate-spin text-yellow-500 mb-3" />
                <p className="text-gray-500 text-sm">La IA está diseñando tu campaña...</p>
              </div>
            )}

            {plan && !loading && (
              <div className="space-y-4">
                {/* Campaign overview */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{plan.campaignName}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">Objetivo: {plan.objective}</p>
                    </div>
                    <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                      <Eye size={12} /> Vista previa
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-gray-900">${plan.budget.daily}/día</p>
                      <p className="text-xs text-gray-400">Presupuesto</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-gray-900">{plan.budget.duration} días</p>
                      <p className="text-xs text-gray-400">Duración</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-gray-900">{plan.estimatedReach}</p>
                      <p className="text-xs text-gray-400">Alcance est.</p>
                    </div>
                  </div>
                </div>

                {/* Ad copy */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Texto del anuncio</h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <p className="font-bold text-gray-900">{plan.adCopy.headline}</p>
                    <p className="text-sm text-gray-700">{plan.adCopy.primaryText}</p>
                    <p className="text-xs text-gray-500 italic">{plan.adCopy.description}</p>
                    <div>
                      <span
                        className="inline-block text-xs font-semibold px-3 py-1 rounded-full text-black mt-1"
                        style={{ backgroundColor: "#FFC207" }}
                      >
                        {plan.adCopy.cta}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Audience */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Audiencia</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Edad</p>
                      <p className="font-medium">{plan.audience.ageMin}–{plan.audience.ageMax} años</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Género</p>
                      <p className="font-medium">{plan.audience.gender}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Ubicaciones</p>
                      <p className="font-medium">{plan.audience.locations.join(", ")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Intereses</p>
                      <div className="flex flex-wrap gap-1">
                        {plan.audience.interests.map((i) => (
                          <span key={i} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">{i}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Publish */}
                {publishResult && (
                  <div className={`p-4 rounded-xl border text-sm font-medium ${publishResult.includes("Error") ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"}`}>
                    {publishResult}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={publishCampaign}
                    disabled={publishing || !hasMetaConfig}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: "#FFC207" }}
                  >
                    {publishing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    {hasMetaConfig ? "Publicar en Meta Ads" : "Configura Meta Ads primero"}
                  </button>
                </div>
              </div>
            )}

            {!plan && !loading && (
              <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-dashed border-gray-200">
                <Cpu size={32} className="text-gray-300 mb-3" />
                <p className="text-gray-400 text-sm">La campaña generada aparecerá aquí</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
