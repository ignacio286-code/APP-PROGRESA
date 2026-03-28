"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import { useClient } from "@/lib/client-context";
import {
  Users, Eye, Heart, TrendingUp, MessageCircle, Share2, Plus, X, Loader2,
  Calendar, Mail, Send, Settings, BarChart2, ChevronRight, Globe, Image,
  Cpu, Video, RefreshCw, Save, Trash2, Edit2,
} from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SocialConn {
  id: string;
  platform: string;
  accountName: string;
  accountId: string;
  accessToken: string;
  isActive: boolean;
}

interface Post {
  id: string;
  platform: string;
  content: string;
  scheduledAt: string;
  status: string;
}

interface ReportConfig {
  id?: string;
  email: string;
  dayOfMonth: number;
  emailText: string;
  platforms: string;
  isActive: boolean;
  lastSentAt?: string;
}

interface FbStats {
  name?: string;
  followers?: number;
  fans?: number;
  reach?: number;
  impressions?: number;
  engagement?: number;
  posts?: { id: string; message: string; created_time: string; likes: number; comments: number }[];
}

const PLATFORMS = [
  { key: "facebook",  label: "Facebook",  color: "#1877f2", icon: "f" },
  { key: "instagram", label: "Instagram", color: "#e1306c", icon: "ig" },
  { key: "tiktok",    label: "TikTok",    color: "#010101", icon: "tt" },
  { key: "youtube",   label: "YouTube",   color: "#ff0000", icon: "yt" },
];

const STAT_TABS = ["Visión General", "Publicaciones", "Planificación", "Informes", "Conexiones"];

function fmtNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n);
}

function clsBtn(active: boolean) {
  return `px-4 py-2 rounded-lg text-sm font-semibold transition-all ${active ? "bg-black text-white" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"}`;
}

// ─── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "20" }}>
          <Icon size={16} style={{ color }} />
        </div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Platform Icon ─────────────────────────────────────────────────────────────

function PlatformBadge({ platform, size = 28 }: { platform: string; size?: number }) {
  const p = PLATFORMS.find(x => x.key === platform);
  return (
    <div className="rounded-lg flex items-center justify-center font-bold text-white text-xs shrink-0"
      style={{ backgroundColor: p?.color || "#999", width: size, height: size }}>
      {p?.icon || platform[0].toUpperCase()}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SocialMediaPage() {
  const { activeClient } = useClient();
  const [tab, setTab] = useState("Visión General");
  const [connections, setConnections] = useState<SocialConn[]>([]);
  const [selectedConn, setSelectedConn] = useState<SocialConn | null>(null);
  const [fbStats, setFbStats] = useState<FbStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");

  // Posts
  const [posts, setPosts] = useState<Post[]>([]);
  const [showPostModal, setShowPostModal] = useState(false);
  const [postForm, setPostForm] = useState({ platform: "facebook", content: "", scheduledAt: "", status: "scheduled" });
  const [savingPost, setSavingPost] = useState(false);

  // Report config
  const [reportConfig, setReportConfig] = useState<ReportConfig>({ email: "", dayOfMonth: 1, emailText: "", platforms: "facebook,instagram", isActive: true });
  const [savingReport, setSavingReport] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);
  const [reportMsg, setReportMsg] = useState("");

  // Connection modal
  const [showConnModal, setShowConnModal] = useState(false);
  const [connForm, setConnForm] = useState({ platform: "facebook", accountName: "", accountId: "", accessToken: "" });
  const [savingConn, setSavingConn] = useState(false);

  const fetchConnections = useCallback(async () => {
    if (!activeClient?.id) return;
    const res = await fetch(`/api/analytics/connections?clientId=${activeClient.id}`);
    if (res.ok) {
      const data = await res.json();
      setConnections(data);
      if (data.length > 0 && !selectedConn) setSelectedConn(data[0]);
    }
  }, [activeClient?.id, selectedConn]);

  const fetchPosts = useCallback(async () => {
    if (!activeClient?.id) return;
    const res = await fetch(`/api/social-media/posts?clientId=${activeClient.id}`);
    if (res.ok) setPosts(await res.json());
  }, [activeClient?.id]);

  const fetchReportConfig = useCallback(async () => {
    if (!activeClient?.id) return;
    const res = await fetch(`/api/social-media/reports?clientId=${activeClient.id}`);
    if (res.ok) {
      const data = await res.json();
      if (data) setReportConfig(data);
    }
  }, [activeClient?.id]);

  useEffect(() => {
    fetchConnections();
    fetchPosts();
    fetchReportConfig();
  }, [fetchConnections, fetchPosts, fetchReportConfig]);

  // Fetch FB stats when connection changes
  useEffect(() => {
    if (!selectedConn || selectedConn.platform !== "facebook") { setFbStats(null); return; }
    fetchFbStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConn?.id]);

  async function fetchFbStats() {
    if (!selectedConn) return;
    setStatsLoading(true); setStatsError("");
    try {
      // Fetch page basic info
      const pageRes = await fetch("/api/social-media/insights", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: selectedConn.accessToken, endpoint: selectedConn.accountId, params: { fields: "name,fan_count,followers_count" } }),
      });
      const pageData = await pageRes.json();
      if (pageData.error) throw new Error(pageData.error);

      // Fetch page insights
      const insightsRes = await fetch("/api/social-media/insights", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: selectedConn.accessToken, endpoint: `${selectedConn.accountId}/insights`,
          params: { metric: "page_impressions,page_reach,page_engaged_users", period: "month", date_preset: "last_month" },
        }),
      });
      const insightsData = await insightsRes.json();

      // Fetch recent posts
      const postsRes = await fetch("/api/social-media/insights", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: selectedConn.accessToken, endpoint: `${selectedConn.accountId}/posts`,
          params: { fields: "id,message,created_time,likes.summary(true),comments.summary(true),shares", limit: "10" },
        }),
      });
      const postsData = await postsRes.json();

      const getMetric = (name: string) => insightsData.data?.find((d: { name: string; values: { value: number }[] }) => d.name === name)?.values?.[0]?.value || 0;

      setFbStats({
        name: pageData.name,
        fans: pageData.fan_count,
        followers: pageData.followers_count,
        impressions: getMetric("page_impressions"),
        reach: getMetric("page_reach"),
        engagement: getMetric("page_engaged_users"),
        posts: postsData.data?.map((p: { id: string; message?: string; created_time: string; likes?: { summary?: { total_count?: number } }; comments?: { summary?: { total_count?: number } } }) => ({
          id: p.id,
          message: p.message || "(sin texto)",
          created_time: p.created_time,
          likes: p.likes?.summary?.total_count || 0,
          comments: p.comments?.summary?.total_count || 0,
        })) || [],
      });
    } catch (e) {
      setStatsError(e instanceof Error ? e.message : "Error al cargar estadísticas");
    } finally { setStatsLoading(false); }
  }

  async function saveConnection() {
    if (!activeClient?.id || !connForm.accountName || !connForm.accessToken) return;
    setSavingConn(true);
    await fetch("/api/analytics/connections", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: activeClient.id, ...connForm, scope: "", isActive: true }),
    });
    setSavingConn(false); setShowConnModal(false);
    setConnForm({ platform: "facebook", accountName: "", accountId: "", accessToken: "" });
    fetchConnections();
  }

  async function deleteConnection(id: string) {
    if (!confirm("¿Eliminar esta conexión?")) return;
    await fetch(`/api/analytics/connections/${id}`, { method: "DELETE" });
    setConnections(prev => prev.filter(c => c.id !== id));
    if (selectedConn?.id === id) setSelectedConn(null);
  }

  async function savePost() {
    if (!activeClient?.id || !postForm.content || !postForm.scheduledAt) return;
    setSavingPost(true);
    await fetch("/api/social-media/posts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: activeClient.id, ...postForm }),
    });
    setSavingPost(false); setShowPostModal(false);
    setPostForm({ platform: "facebook", content: "", scheduledAt: "", status: "scheduled" });
    fetchPosts();
  }

  async function deletePost(id: string) {
    await fetch(`/api/social-media/posts/${id}`, { method: "DELETE" });
    setPosts(prev => prev.filter(p => p.id !== id));
  }

  async function saveReport() {
    if (!activeClient?.id) return;
    setSavingReport(true);
    await fetch("/api/social-media/reports", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: activeClient.id, ...reportConfig }),
    });
    setSavingReport(false);
    setReportMsg("✓ Configuración guardada");
    setTimeout(() => setReportMsg(""), 3000);
  }

  async function sendReport() {
    if (!activeClient?.id) return;
    setSendingReport(true);
    const res = await fetch("/api/social-media/reports", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: activeClient.id, clientName: activeClient.name, platforms: reportConfig.platforms }),
    });
    const data = await res.json();
    setSendingReport(false);
    setReportMsg(data.ok ? "✓ Informe enviado correctamente" : `Error: ${data.error}`);
    setTimeout(() => setReportMsg(""), 5000);
  }

  if (!activeClient) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header title="Social Media" subtitle="Gestión y analítica de redes sociales" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <Globe size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 font-medium">Selecciona un cliente activo</p>
            <p className="text-sm text-gray-400 mt-1">Ve a Gestión de Clientes y activa uno primero</p>
          </div>
        </div>
      </div>
    );
  }

  // Calendar data for planning
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = now.toLocaleDateString("es-CL", { month: "long", year: "numeric" });

  const postsMap: Record<number, Post[]> = {};
  posts.forEach(p => {
    const d = new Date(p.scheduledAt);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!postsMap[day]) postsMap[day] = [];
      postsMap[day].push(p);
    }
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header title="Social Media" subtitle={`${activeClient.name} — Gestión de redes sociales`} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — accounts */}
        <div className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col p-3 gap-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 mb-1">Cuentas</p>
          {connections.length === 0 && <p className="text-xs text-gray-400 px-2 py-4 text-center">Sin cuentas conectadas</p>}
          {connections.map(conn => (
            <button key={conn.id} onClick={() => setSelectedConn(conn)}
              className={`flex items-center gap-2 px-2 py-2 rounded-lg text-left transition ${selectedConn?.id === conn.id ? "bg-yellow-50 border border-yellow-200" : "hover:bg-gray-50"}`}>
              <PlatformBadge platform={conn.platform} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{conn.accountName}</p>
                <p className="text-xs text-gray-400 capitalize">{conn.platform}</p>
              </div>
            </button>
          ))}
          <button onClick={() => setShowConnModal(true)}
            className="flex items-center gap-2 px-2 py-2 rounded-lg text-xs text-gray-500 hover:bg-gray-50 mt-auto border border-dashed border-gray-200">
            <Plus size={14} /> Conectar cuenta
          </button>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Tab bar */}
          <div className="bg-white border-b border-gray-200 px-4 flex items-center gap-1 overflow-x-auto shrink-0">
            {STAT_TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${tab === t ? "border-yellow-400 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                {t}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5">

            {/* ── Visión General ── */}
            {tab === "Visión General" && (
              <div className="space-y-5">
                {!selectedConn ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <BarChart2 size={40} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">Selecciona una cuenta conectada para ver estadísticas</p>
                    <button onClick={() => setShowConnModal(true)} className="mt-3 px-4 py-2 rounded-lg text-sm font-medium text-black" style={{ backgroundColor: "#FFC207" }}>
                      <Plus size={14} className="inline mr-1" /> Conectar cuenta
                    </button>
                  </div>
                ) : statsLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 size={24} className="animate-spin text-gray-400" />
                  </div>
                ) : statsError ? (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                    <p className="text-red-700 text-sm font-medium">{statsError}</p>
                    <p className="text-red-500 text-xs mt-1">Verifica que el access token sea válido y tenga los permisos correctos.</p>
                    <button onClick={fetchFbStats} className="mt-3 flex items-center gap-2 text-sm text-red-600 hover:underline">
                      <RefreshCw size={13} /> Reintentar
                    </button>
                  </div>
                ) : fbStats ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <PlatformBadge platform={selectedConn.platform} size={36} />
                        <div>
                          <p className="font-bold text-gray-900">{fbStats.name || selectedConn.accountName}</p>
                          <p className="text-xs text-gray-400 capitalize">{selectedConn.platform}</p>
                        </div>
                      </div>
                      <button onClick={fetchFbStats} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><RefreshCw size={15} /></button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <KpiCard label="Seguidores" value={fmtNum(fbStats.followers || 0)} icon={Users} color="#1877f2" />
                      <KpiCard label="Me gusta" value={fmtNum(fbStats.fans || 0)} icon={Heart} color="#e1306c" />
                      <KpiCard label="Alcance" value={fmtNum(fbStats.reach || 0)} icon={Eye} color="#10b981" />
                      <KpiCard label="Interacciones" value={fmtNum(fbStats.engagement || 0)} icon={TrendingUp} color="#FFC207" />
                    </div>
                    {fbStats.posts && fbStats.posts.length > 0 && (
                      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="px-5 py-3 border-b border-gray-100">
                          <p className="font-semibold text-gray-800 text-sm">Publicaciones recientes</p>
                        </div>
                        <div className="divide-y divide-gray-50">
                          {fbStats.posts.slice(0, 5).map(p => (
                            <div key={p.id} className="px-5 py-3 flex items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-700 truncate">{p.message}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{new Date(p.created_time).toLocaleDateString("es-CL")}</p>
                              </div>
                              <div className="flex gap-3 text-xs text-gray-500 shrink-0">
                                <span className="flex items-center gap-1"><Heart size={12} />{p.likes}</span>
                                <span className="flex items-center gap-1"><MessageCircle size={12} />{p.comments}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                    <p className="text-gray-500 text-sm">Cuenta seleccionada: <strong>{selectedConn.accountName}</strong></p>
                    <p className="text-xs text-gray-400 mt-1">Estadísticas disponibles para Facebook/Instagram con token válido.</p>
                    <button onClick={fetchFbStats} className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 mx-auto">
                      <RefreshCw size={14} /> Cargar estadísticas
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Publicaciones ── */}
            {tab === "Publicaciones" && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <p className="font-semibold text-gray-800">Historial de publicaciones</p>
                  </div>
                  {fbStats?.posts && fbStats.posts.length > 0 ? (
                    <div className="divide-y divide-gray-50">
                      {fbStats.posts.map(p => (
                        <div key={p.id} className="px-5 py-4">
                          <div className="flex items-start gap-3">
                            <PlatformBadge platform={selectedConn?.platform || "facebook"} size={32} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-800">{p.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{new Date(p.created_time).toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" })}</p>
                            </div>
                            <div className="flex gap-4 text-sm text-gray-600 shrink-0">
                              <span className="flex items-center gap-1"><Heart size={14} />{p.likes}</span>
                              <span className="flex items-center gap-1"><MessageCircle size={14} />{p.comments}</span>
                              <span className="flex items-center gap-1"><Share2 size={14} />0</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center text-gray-400">
                      <Image size={32} className="mx-auto mb-3 text-gray-200" />
                      Carga las estadísticas desde Visión General para ver las publicaciones
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Planificación ── */}
            {tab === "Planificación" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-gray-900 capitalize">{monthName}</h2>
                  <button onClick={() => setShowPostModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-black" style={{ backgroundColor: "#FFC207" }}>
                    <Plus size={15} /> Crear publicación
                  </button>
                </div>

                {/* Calendar grid */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="grid grid-cols-7 border-b border-gray-100">
                    {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(d => (
                      <div key={d} className="px-2 py-2 text-xs font-semibold text-gray-400 text-center">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7">
                    {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} className="border-r border-b border-gray-50 h-24" />)}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const dayPosts = postsMap[day] || [];
                      const isToday = day === now.getDate();
                      return (
                        <div key={day} className={`border-r border-b border-gray-50 h-24 p-1.5 ${isToday ? "bg-yellow-50" : ""}`}>
                          <div className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? "bg-yellow-400 text-black" : "text-gray-600"}`}>{day}</div>
                          {dayPosts.map(p => (
                            <div key={p.id} className="text-xs rounded px-1 py-0.5 mb-0.5 truncate cursor-pointer"
                              style={{ backgroundColor: PLATFORMS.find(x => x.key === p.platform)?.color + "20", color: PLATFORMS.find(x => x.key === p.platform)?.color }}>
                              {p.content.slice(0, 20)}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Upcoming posts list */}
                {posts.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100">
                      <p className="font-semibold text-gray-800 text-sm">Publicaciones programadas</p>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {posts.map(p => (
                        <div key={p.id} className="px-5 py-3 flex items-start gap-3">
                          <PlatformBadge platform={p.platform} size={28} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 truncate">{p.content}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{new Date(p.scheduledAt).toLocaleString("es-CL")}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status === "published" ? "bg-green-100 text-green-700" : p.status === "draft" ? "bg-gray-100 text-gray-600" : "bg-blue-100 text-blue-700"}`}>{p.status}</span>
                          <button onClick={() => deletePost(p.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Informes ── */}
            {tab === "Informes" && (
              <div className="max-w-xl space-y-5">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 rounded-lg bg-yellow-50"><Mail size={18} style={{ color: "#b8860b" }} /></div>
                    <div>
                      <p className="font-bold text-gray-900">Informe Mensual Automático</p>
                      <p className="text-xs text-gray-400">Se enviará el día elegido de cada mes</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Correo destinatario</label>
                      <input type="email" value={reportConfig.email} onChange={e => setReportConfig(r => ({ ...r, email: e.target.value }))}
                        placeholder="cliente@empresa.com"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Día del mes de envío</label>
                      <input type="number" min={1} max={28} value={reportConfig.dayOfMonth}
                        onChange={e => setReportConfig(r => ({ ...r, dayOfMonth: parseInt(e.target.value) || 1 }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Plataformas (separadas por coma)</label>
                      <input value={reportConfig.platforms} onChange={e => setReportConfig(r => ({ ...r, platforms: e.target.value }))}
                        placeholder="facebook,instagram,youtube"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Texto del correo</label>
                      <textarea value={reportConfig.emailText} onChange={e => setReportConfig(r => ({ ...r, emailText: e.target.value }))} rows={4}
                        placeholder="Estimado cliente, adjuntamos el informe mensual de sus redes sociales..."
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="activeReport" checked={reportConfig.isActive}
                        onChange={e => setReportConfig(r => ({ ...r, isActive: e.target.checked }))} className="accent-yellow-400" />
                      <label htmlFor="activeReport" className="text-sm text-gray-700">Envío automático activo</label>
                    </div>
                  </div>
                  {reportConfig.lastSentAt && (
                    <p className="text-xs text-gray-400 mt-3">Último envío: {new Date(reportConfig.lastSentAt).toLocaleDateString("es-CL")}</p>
                  )}
                  {reportMsg && <p className={`text-sm font-medium mt-3 ${reportMsg.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>{reportMsg}</p>}
                  <div className="flex gap-3 mt-5">
                    <button onClick={saveReport} disabled={savingReport}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-black disabled:opacity-60 flex-1"
                      style={{ backgroundColor: "#FFC207" }}>
                      {savingReport ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      {savingReport ? "Guardando..." : "Guardar configuración"}
                    </button>
                    <button onClick={sendReport} disabled={sendingReport || !reportConfig.email}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-60">
                      {sendingReport ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      {sendingReport ? "Enviando..." : "Enviar ahora"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Conexiones ── */}
            {tab === "Conexiones" && (
              <div className="max-w-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-gray-900">Cuentas conectadas</p>
                  <button onClick={() => setShowConnModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-black" style={{ backgroundColor: "#FFC207" }}>
                    <Plus size={14} /> Conectar cuenta
                  </button>
                </div>
                {connections.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <Globe size={40} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 font-medium">Sin cuentas conectadas</p>
                    <p className="text-sm text-gray-400 mt-1">Conecta tus cuentas de Facebook, Instagram, TikTok o YouTube</p>
                    <button onClick={() => setShowConnModal(true)} className="mt-4 px-4 py-2 rounded-lg text-sm font-medium text-black" style={{ backgroundColor: "#FFC207" }}>
                      <Plus size={14} className="inline mr-1" /> Conectar primera cuenta
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {connections.map(conn => (
                      <div key={conn.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                        <PlatformBadge platform={conn.platform} size={40} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900">{conn.accountName}</p>
                          <p className="text-xs text-gray-400">ID: {conn.accountId}</p>
                          <p className="text-xs text-gray-300">Token: {conn.accessToken.slice(0, 20)}...</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${conn.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {conn.isActive ? "Activa" : "Inactiva"}
                        </span>
                        <button onClick={() => deleteConnection(conn.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
                  <p className="font-semibold mb-2">¿Cómo obtener tu access token de Facebook?</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Ve a developers.facebook.com → Tu App → Tools → Graph API Explorer</li>
                    <li>Selecciona tu Page en "User or Page"</li>
                    <li>Agrega permisos: pages_read_engagement, pages_show_list, read_insights</li>
                    <li>Genera el token y cópialo aquí</li>
                    <li>El Page ID lo encuentras en Info de la Página → Acerca de</li>
                  </ol>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── New Post Modal ── */}
      {showPostModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Nueva Publicación</h2>
              <button onClick={() => setShowPostModal(false)}><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Plataforma</label>
                <select value={postForm.platform} onChange={e => setPostForm(f => ({ ...f, platform: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400">
                  {PLATFORMS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Contenido</label>
                <textarea value={postForm.content} onChange={e => setPostForm(f => ({ ...f, content: e.target.value }))} rows={4}
                  placeholder="Escribe el contenido de la publicación..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fecha y hora de publicación</label>
                <input type="datetime-local" value={postForm.scheduledAt} onChange={e => setPostForm(f => ({ ...f, scheduledAt: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
                <select value={postForm.status} onChange={e => setPostForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400">
                  <option value="draft">Borrador</option>
                  <option value="scheduled">Programado</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowPostModal(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm">Cancelar</button>
              <button onClick={savePost} disabled={savingPost || !postForm.content || !postForm.scheduledAt}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-black disabled:opacity-60"
                style={{ backgroundColor: "#FFC207" }}>
                {savingPost ? "Guardando..." : "Guardar publicación"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── New Connection Modal ── */}
      {showConnModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Conectar cuenta</h2>
              <button onClick={() => setShowConnModal(false)}><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Plataforma</label>
                <select value={connForm.platform} onChange={e => setConnForm(f => ({ ...f, platform: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400">
                  {PLATFORMS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre de la cuenta / Página</label>
                <input value={connForm.accountName} onChange={e => setConnForm(f => ({ ...f, accountName: e.target.value }))}
                  placeholder="Mi Página de Facebook"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Page ID / Account ID</label>
                <input value={connForm.accountId} onChange={e => setConnForm(f => ({ ...f, accountId: e.target.value }))}
                  placeholder="123456789012345"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Access Token</label>
                <textarea value={connForm.accessToken} onChange={e => setConnForm(f => ({ ...f, accessToken: e.target.value }))} rows={3}
                  placeholder="EAABwzLixnjYB..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none font-mono text-xs" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowConnModal(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm">Cancelar</button>
              <button onClick={saveConnection} disabled={savingConn || !connForm.accountName || !connForm.accessToken}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-black disabled:opacity-60"
                style={{ backgroundColor: "#FFC207" }}>
                {savingConn ? "Conectando..." : "Conectar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
