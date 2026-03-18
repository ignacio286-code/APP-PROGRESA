"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { useClient } from "@/lib/client-context";
import { AlertCircle, Loader2, Cpu, Send, CheckCircle2, ChevronRight } from "lucide-react";
import Link from "next/link";

interface GoogleCampaignPlan {
  campaignName: string;
  campaignType: string;
  keywords: { keyword: string; matchType: string; bidSuggestion: number }[];
  adGroups: { name: string; keywords: string[] }[];
  ads: { headline1: string; headline2: string; headline3: string; description1: string; description2: string; displayUrl: string }[];
  extensions: { type: string; content: string }[];
  targetLocations: string[];
  budget: { daily: number; bidStrategy: string };
  estimatedClicks: string;
  estimatedCPC: string;
}

const CAMPAIGN_TYPES = ["Search", "Display", "Shopping", "YouTube", "Performance Max"];

export default function GoogleCampaignPage() {
  const { activeClient } = useClient();
  const [campaignType, setCampaignType] = useState("Search");
  const [product, setProduct] = useState("");
  const [goal, setGoal] = useState("");
  const [budget, setBudget] = useState("30");
  const [targetLocation, setTargetLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<GoogleCampaignPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<string | null>(null);

  const hasGoogleConfig = !!(activeClient?.googleClientId && activeClient?.googleDeveloperToken);

  async function generate() {
    if (!product || !goal) return;
    setLoading(true);
    setError(null);
    setPlan(null);
    try {
      const res = await fetch("/api/paid-media/google/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: activeClient?.name,
          campaignType,
          product,
          goal,
          dailyBudget: budget,
          targetLocation,
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
    if (!plan || !activeClient) return;
    setPublishing(true);
    setPublishResult(null);
    try {
      const res = await fetch("/api/paid-media/google/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, client: activeClient }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPublishResult(`Campaña creada en Google Ads: ID ${data.campaignId || "generado"}`);
    } catch (err) {
      setPublishResult("Error: " + String(err));
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div>
      <Header title="Creador de Campañas Google Ads" subtitle="La IA genera keywords, anuncios y estructura completa" />

      <div className="p-6">
        {!activeClient ? (
          <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl mb-6">
            <AlertCircle size={20} className="text-yellow-600" />
            <p className="text-sm text-yellow-700">Selecciona un cliente activo.</p>
          </div>
        ) : !hasGoogleConfig ? (
          <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-red-600" />
              <p className="text-sm text-red-700"><strong>{activeClient.name}</strong> no tiene Google Ads configurado.</p>
            </div>
            <Link href="/paid-media/connections" className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg text-white bg-red-500">
              Configurar <ChevronRight size={12} />
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl mb-6">
            <CheckCircle2 size={16} className="text-green-500" />
            <p className="text-sm text-green-700">Google Ads conectado — Customer ID: <code className="bg-green-100 px-1 rounded">{activeClient.googleCustomerId}</code></p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Parámetros</h3>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Tipo de campaña</p>
                <div className="flex flex-wrap gap-2">
                  {CAMPAIGN_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setCampaignType(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        campaignType === t ? "text-black border-yellow-400" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                      style={campaignType === t ? { backgroundColor: "#FFC20730" } : {}}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Producto / Servicio *</label>
                <input
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="ej: Software de contabilidad para PYMES"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo *</label>
                <input
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="ej: Aumentar registros de prueba gratuita"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación objetivo</label>
                <input
                  value={targetLocation}
                  onChange={(e) => setTargetLocation(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="ej: Colombia, México, España"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Presupuesto diario ($)</label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  min="10"
                />
              </div>

              <button
                onClick={generate}
                disabled={loading || !product || !goal}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#FFC207" }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Cpu size={16} />}
                {loading ? "Generando..." : "Generar campaña"}
              </button>
            </div>
          </div>

          {/* Result */}
          <div className="lg:col-span-3 space-y-4">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-gray-200">
                <Loader2 size={32} className="animate-spin text-yellow-500 mb-3" />
                <p className="text-gray-500 text-sm">Generando keywords y anuncios...</p>
              </div>
            )}

            {plan && !loading && (
              <>
                {/* Overview */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{plan.campaignName}</h3>
                  <p className="text-sm text-gray-500 mb-4">{plan.campaignType} · {plan.targetLocations.join(", ")}</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold">${plan.budget.daily}/día</p>
                      <p className="text-xs text-gray-400">Presupuesto</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold">{plan.estimatedClicks}</p>
                      <p className="text-xs text-gray-400">Clics estimados</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold">{plan.estimatedCPC}</p>
                      <p className="text-xs text-gray-400">CPC estimado</p>
                    </div>
                  </div>
                </div>

                {/* Keywords */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Palabras clave ({plan.keywords.length})</h3>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {plan.keywords.map((kw, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">{kw.matchType}</span>
                          <span className="text-gray-800">{kw.keyword}</span>
                        </div>
                        <span className="text-xs text-gray-400">${kw.bidSuggestion} CPC</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ads */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Anuncios responsive</h3>
                  {plan.ads.map((ad, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-4 mb-2">
                      <p className="text-blue-700 font-semibold text-sm">{ad.headline1} | {ad.headline2} | {ad.headline3}</p>
                      <p className="text-green-700 text-xs mt-0.5">{ad.displayUrl}</p>
                      <p className="text-gray-600 text-xs mt-1">{ad.description1}</p>
                      <p className="text-gray-600 text-xs">{ad.description2}</p>
                    </div>
                  ))}
                </div>

                {/* Extensions */}
                {plan.extensions.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Extensiones</h3>
                    <div className="space-y-2">
                      {plan.extensions.map((ext, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 rounded">{ext.type}</span>
                          <span className="text-gray-700">{ext.content}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {publishResult && (
                  <div className={`p-4 rounded-xl border text-sm font-medium ${publishResult.includes("Error") ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"}`}>
                    {publishResult}
                  </div>
                )}

                <button
                  onClick={publishCampaign}
                  disabled={publishing || !hasGoogleConfig}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: "#FFC207" }}
                >
                  {publishing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {hasGoogleConfig ? "Publicar en Google Ads" : "Configura Google Ads primero"}
                </button>
              </>
            )}

            {!plan && !loading && (
              <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-dashed border-gray-200">
                <Cpu size={32} className="text-gray-300 mb-3" />
                <p className="text-gray-400 text-sm">La campaña aparecerá aquí</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
