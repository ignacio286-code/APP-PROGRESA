"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/Header";
import { useClient } from "@/lib/client-context";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Users,
  Eye,
  Heart,
  MousePointer,
  TrendingUp,
  MessageCircle,
  Share2,
  Play,
  DollarSign,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const PLATFORM_META: Record<string, { label: string; color: string }> = {
  facebook: { label: "Facebook", color: "#1877f2" },
  instagram: { label: "Instagram", color: "#e1306c" },
  youtube: { label: "YouTube", color: "#ff0000" },
  tiktok: { label: "TikTok", color: "#010101" },
  linkedin: { label: "LinkedIn", color: "#0077b5" },
  google_ads: { label: "Google Ads", color: "#4285f4" },
};

function KpiCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "20" }}>
          <Icon size={18} style={{ color }} />
        </div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

// ── Platform-specific renderers ────────────────────────────────────────────────

function FacebookView({ data }: { data: Record<string, unknown> }) {
  const summary = data.summary as { followers: number; fans: number } | undefined;
  const posts = (data.posts as Array<Record<string, unknown>>) || [];
  const insights = (data.insights as Array<{ name: string; values: Array<{ value: number; end_time: string }> }>) || [];

  // Build chart data from insights
  const reachInsight = insights.find((i) => i.name === "page_reach");
  const impressionsInsight = insights.find((i) => i.name === "page_impressions");
  const chartData = (reachInsight?.values || []).map((v, idx) => ({
    date: v.end_time?.split("T")[0] || idx,
    Alcance: v.value,
    Impresiones: impressionsInsight?.values[idx]?.value || 0,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Seguidores" value={formatNumber(summary?.followers || 0)} icon={Users} color="#1877f2" />
        <KpiCard label="Fans" value={formatNumber(summary?.fans || 0)} icon={Heart} color="#e1306c" />
        <KpiCard label="Posts en período" value={posts.length} icon={MessageCircle} color="#FFC207" />
        <KpiCard label="Plataforma" value="Facebook" icon={TrendingUp} color="#1877f2" />
      </div>

      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Alcance e Impresiones diarias</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }} />
              <Legend />
              <Line type="monotone" dataKey="Alcance" stroke="#1877f2" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Impresiones" stroke="#FFC207" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {posts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Últimas publicaciones</h3>
          <div className="space-y-3">
            {posts.slice(0, 5).map((post) => {
              const p = post as { id: string; message?: string; created_time?: string; likes?: { summary?: { total_count?: number } }; comments?: { summary?: { total_count?: number } }; shares?: { count?: number } };
              return (
                <div key={p.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="text-sm text-gray-700 truncate">{p.message || "(Sin texto)"}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{p.created_time?.split("T")[0]}</p>
                  </div>
                  <div className="flex gap-3 text-xs text-gray-500 shrink-0">
                    <span className="flex items-center gap-1"><Heart size={12} /> {p.likes?.summary?.total_count || 0}</span>
                    <span className="flex items-center gap-1"><MessageCircle size={12} /> {p.comments?.summary?.total_count || 0}</span>
                    <span className="flex items-center gap-1"><Share2 size={12} /> {p.shares?.count || 0}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function InstagramView({ data }: { data: Record<string, unknown> }) {
  const summary = data.summary as { followers: number; mediaCount: number } | undefined;
  const account = data.account as { username?: string; profilePicture?: string } | undefined;
  const media = (data.media as Array<Record<string, unknown>>) || [];
  const insights = (data.insights as Array<{ name: string; values: Array<{ value: number; end_time: string }> }>) || [];

  const reachInsight = insights.find((i) => i.name === "reach");
  const impInsight = insights.find((i) => i.name === "impressions");
  const chartData = (reachInsight?.values || []).map((v, idx) => ({
    date: v.end_time?.split("T")[0] || idx,
    Alcance: v.value,
    Impresiones: impInsight?.values[idx]?.value || 0,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Seguidores" value={formatNumber(summary?.followers || 0)} icon={Users} color="#e1306c" />
        <KpiCard label="Publicaciones" value={summary?.mediaCount || 0} icon={Eye} color="#FFC207" />
        <KpiCard label="Usuario" value={`@${account?.username || "—"}`} icon={TrendingUp} color="#e1306c" />
        <KpiCard label="Contenido período" value={media.length} icon={MessageCircle} color="#9c27b0" />
      </div>

      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Alcance e Impresiones diarias</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }} />
              <Legend />
              <Line type="monotone" dataKey="Alcance" stroke="#e1306c" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Impresiones" stroke="#FFC207" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {media.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Últimas publicaciones</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {media.slice(0, 8).map((item) => {
              const m = item as { id: string; media_type?: string; media_url?: string; thumbnail_url?: string; caption?: string; like_count?: number; comments_count?: number };
              const img = m.thumbnail_url || m.media_url;
              return (
                <div key={m.id} className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                  {img ? (
                    <img src={img} alt="" className="w-full h-28 object-cover" />
                  ) : (
                    <div className="w-full h-28 flex items-center justify-center bg-gray-100">
                      <Play size={24} className="text-gray-400" />
                    </div>
                  )}
                  <div className="p-2">
                    <p className="text-xs text-gray-500 truncate">{m.caption || "(Sin descripción)"}</p>
                    <div className="flex gap-2 mt-1 text-xs text-gray-400">
                      <span>❤️ {m.like_count || 0}</span>
                      <span>💬 {m.comments_count || 0}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function YouTubeView({ data }: { data: Record<string, unknown> }) {
  const summary = data.summary as { subscribers: number; views: number; videoCount: number } | undefined;
  const rows = (data.analytics as Array<unknown[]>) || [];
  const headers = (data.analyticsHeaders as Array<{ name: string }>) || [];

  const dateIdx = headers.findIndex((h) => h.name === "day");
  const viewsIdx = headers.findIndex((h) => h.name === "views");
  const watchIdx = headers.findIndex((h) => h.name === "estimatedMinutesWatched");

  const chartData = rows.map((row) => ({
    date: row[dateIdx] as string,
    Vistas: row[viewsIdx] as number,
    "Minutos vistos": row[watchIdx] as number,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Suscriptores" value={formatNumber(summary?.subscribers || 0)} icon={Users} color="#ff0000" />
        <KpiCard label="Vistas totales" value={formatNumber(summary?.views || 0)} icon={Eye} color="#FFC207" />
        <KpiCard label="Videos" value={summary?.videoCount || 0} icon={Play} color="#ff0000" />
        <KpiCard label="Vistas (período)" value={rows.reduce((s, r) => s + ((r[viewsIdx] as number) || 0), 0)} icon={TrendingUp} color="#4caf50" />
      </div>

      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Vistas diarias</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }} />
              <Bar dataKey="Vistas" fill="#ff0000" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function TikTokView({ data }: { data: Record<string, unknown> }) {
  const summary = data.summary as { followers: number } | undefined;
  const metrics = (data.metrics as Array<Record<string, unknown>>) || [];

  const chartData = metrics.map((m) => {
    const d = m.dimensions as Record<string, unknown> | undefined;
    const mt = m.metrics as Record<string, unknown> | undefined;
    return {
      date: d?.stat_time_day as string,
      Impresiones: (mt?.impressions as number) || 0,
      Clics: (mt?.clicks as number) || 0,
      Gasto: Number(((mt?.spend as number) || 0).toFixed(2)),
    };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Seguidores" value={formatNumber(summary?.followers || 0)} icon={Users} color="#010101" />
        <KpiCard label="Días con datos" value={metrics.length} icon={TrendingUp} color="#FFC207" />
        <KpiCard label="Impresiones" value={formatNumber(chartData.reduce((s, r) => s + r.Impresiones, 0))} icon={Eye} color="#69c9d0" />
        <KpiCard label="Clics" value={formatNumber(chartData.reduce((s, r) => s + r.Clics, 0))} icon={MousePointer} color="#010101" />
      </div>

      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Impresiones y Clics diarios</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }} />
              <Legend />
              <Bar dataKey="Impresiones" fill="#69c9d0" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Clics" fill="#010101" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function LinkedInView({ data }: { data: Record<string, unknown> }) {
  const summary = data.summary as { followers: number } | undefined;
  const stats = (data.stats as Array<Record<string, unknown>>) || [];

  const chartData = stats.map((s) => {
    const period = s.timeRange as { start?: number } | undefined;
    const metrics = s.totalShareStatistics as Record<string, number> | undefined;
    return {
      date: period?.start ? new Date(period.start).toISOString().split("T")[0] : "",
      Impresiones: metrics?.impressionCount || 0,
      Clics: metrics?.clickCount || 0,
      Engagement: metrics?.likeCount || 0,
    };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Seguidores" value={formatNumber(summary?.followers || 0)} icon={Users} color="#0077b5" />
        <KpiCard label="Impresiones" value={formatNumber(chartData.reduce((s, r) => s + r.Impresiones, 0))} icon={Eye} color="#FFC207" />
        <KpiCard label="Clics" value={formatNumber(chartData.reduce((s, r) => s + r.Clics, 0))} icon={MousePointer} color="#0077b5" />
        <KpiCard label="Engagement" value={formatNumber(chartData.reduce((s, r) => s + r.Engagement, 0))} icon={Heart} color="#e1306c" />
      </div>

      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Impresiones y Clics</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }} />
              <Legend />
              <Line type="monotone" dataKey="Impresiones" stroke="#0077b5" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Clics" stroke="#FFC207" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function GoogleAdsView({ data }: { data: Record<string, unknown> }) {
  const campaigns = (data.campaigns as Array<Record<string, unknown>>) || [];

  const rows = campaigns.map((c) => {
    const camp = c.campaign as Record<string, string | number> | undefined;
    const m = c.metrics as Record<string, number> | undefined;
    return {
      name: camp?.name || "—",
      status: camp?.status || "—",
      impressions: m?.impressions || 0,
      clicks: m?.clicks || 0,
      ctr: ((m?.ctr || 0) * 100).toFixed(2) + "%",
      cpc: "$" + (((m?.averageCpc || 0) / 1_000_000)).toFixed(2),
      conversions: m?.conversions || 0,
      cost: "$" + (((m?.costMicros || 0) / 1_000_000)).toFixed(2),
    };
  });

  const totals = {
    impressions: rows.reduce((s, r) => s + r.impressions, 0),
    clicks: rows.reduce((s, r) => s + r.clicks, 0),
    conversions: rows.reduce((s, r) => s + r.conversions, 0),
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Impresiones" value={formatNumber(totals.impressions)} icon={Eye} color="#4285f4" />
        <KpiCard label="Clics" value={formatNumber(totals.clicks)} icon={MousePointer} color="#FFC207" />
        <KpiCard label="CTR promedio" value={totals.impressions ? ((totals.clicks / totals.impressions) * 100).toFixed(2) + "%" : "—"} icon={TrendingUp} color="#4285f4" />
        <KpiCard label="Conversiones" value={totals.conversions} icon={DollarSign} color="#34a853" />
      </div>

      {rows.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Campañas</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Campaña</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">Impresiones</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">Clics</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">CTR</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">CPC</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">Conversiones</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">Gasto</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-medium text-gray-800 max-w-[180px] truncate">{row.name}</td>
                    <td className="py-2.5 px-3 text-right text-gray-600">{formatNumber(row.impressions)}</td>
                    <td className="py-2.5 px-3 text-right text-gray-600">{formatNumber(row.clicks)}</td>
                    <td className="py-2.5 px-3 text-right text-gray-600">{row.ctr}</td>
                    <td className="py-2.5 px-3 text-right text-gray-600">{row.cpc}</td>
                    <td className="py-2.5 px-3 text-right text-gray-600">{row.conversions}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-gray-800">{row.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function PlatformAnalyticsPage() {
  const { platform } = useParams<{ platform: string }>();
  const { activeClient } = useClient();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);

  const meta = PLATFORM_META[platform] || { label: platform, color: "#FFC207" };

  const fetchMetrics = useCallback(async () => {
    if (!activeClient) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/analytics/${platform}/metrics?clientId=${activeClient.id}&from=${dateFrom}&to=${dateTo}`
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Error al obtener métricas");
        setData(null);
      } else {
        setData(json.results?.[0] || null);
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }, [activeClient, platform, dateFrom, dateTo]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  function renderPlatformData(platformData: Record<string, unknown>) {
    if (platform === "facebook") return <FacebookView data={platformData} />;
    if (platform === "instagram") return <InstagramView data={platformData} />;
    if (platform === "youtube") return <YouTubeView data={platformData} />;
    if (platform === "tiktok") return <TikTokView data={platformData} />;
    if (platform === "linkedin") return <LinkedInView data={platformData} />;
    if (platform === "google_ads") return <GoogleAdsView data={platformData} />;
    return <p className="text-gray-500">Plataforma no implementada.</p>;
  }

  return (
    <div className="p-6 space-y-6">
      <Header title={`Analítica · ${meta.label}`} subtitle={`Métricas de ${meta.label} para ${activeClient?.name || "cliente activo"}`} />

      {!activeClient && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
          Selecciona un cliente activo para ver sus métricas.
        </div>
      )}

      {/* Date filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-600">Desde</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-600">Hasta</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>
        <button
          onClick={fetchMetrics}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-black transition-all disabled:opacity-50"
          style={{ backgroundColor: "#FFC207" }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Actualizar
        </button>
        <a
          href={`/analytics/${platform === "google_ads" ? "google_ads" : platform}/../../analytics`}
          className="ml-auto text-xs text-gray-400 hover:text-gray-600"
        >
          ← Volver a conexiones
        </a>
      </div>

      {/* Content */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={36} className="animate-spin text-gray-300" />
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">Error al cargar métricas</p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
            {error.includes("No hay conexión") && (
              <a href="/analytics" className="inline-block mt-2 text-xs font-semibold text-red-700 underline">
                Conectar cuenta de {meta.label}
              </a>
            )}
          </div>
        </div>
      )}

      {!loading && !error && data && (
        data.error ? (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 text-sm text-orange-800">
            {String(data.error)}
          </div>
        ) : (
          renderPlatformData(data)
        )
      )}

      {!loading && !error && !data && activeClient && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <TrendingUp size={40} className="mb-3 opacity-30" />
          <p className="text-sm">No hay datos disponibles para este período.</p>
        </div>
      )}
    </div>
  );
}
