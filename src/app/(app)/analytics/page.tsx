"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import { useClient } from "@/lib/client-context";
import {
  CheckCircle2, XCircle, Plus, Loader2, Unlink,
  Facebook, Youtube, Linkedin, BarChart2, TrendingUp,
  Users, Eye, ChevronDown, ChevronUp, Copy, Check,
  BookOpen, ExternalLink, AlertTriangle,
} from "lucide-react";

interface SocialConnection {
  id: string;
  platform: string;
  accountName: string;
  accountId: string;
  isActive: boolean;
  createdAt: string;
}

interface PlatformConfig {
  key: string;
  label: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  description: string;
}

const platforms: PlatformConfig[] = [
  {
    key: "facebook",
    label: "Facebook",
    color: "#1877f2",
    bgColor: "#e7f0fd",
    icon: <Facebook size={22} />,
    description: "Páginas, alcance, engagement e insights de audiencia",
  },
  {
    key: "instagram",
    label: "Instagram",
    color: "#e1306c",
    bgColor: "#fce4ec",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
    description: "Posts, stories, reels, seguidores e interacciones",
  },
  {
    key: "youtube",
    label: "YouTube",
    color: "#ff0000",
    bgColor: "#ffebee",
    icon: <Youtube size={22} />,
    description: "Suscriptores, vistas, tiempo de reproducción y videos",
  },
  {
    key: "tiktok",
    label: "TikTok",
    color: "#010101",
    bgColor: "#f5f5f5",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.35a8.16 8.16 0 004.77 1.52V7.43a4.85 4.85 0 01-1-.74z" />
      </svg>
    ),
    description: "Seguidores, vistas de video, likes y comentarios",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    color: "#0077b5",
    bgColor: "#e8f4f9",
    icon: <Linkedin size={22} />,
    description: "Seguidores de página, impresiones, engagement y clics",
  },
  {
    key: "google_ads",
    label: "Google Ads",
    color: "#4285f4",
    bgColor: "#e8f0fe",
    icon: <BarChart2 size={22} />,
    description: "Campañas, clics, conversiones, CTR y ROAS",
  },
];

// Setup guide data per platform
const APP_URL = "http://localhost:3001";

const setupGuides = [
  {
    key: "facebook",
    label: "Facebook & Instagram",
    color: "#1877f2",
    bgColor: "#e7f0fd",
    portalUrl: "https://developers.facebook.com/apps",
    portalLabel: "developers.facebook.com",
    envVars: ["META_APP_ID", "META_APP_SECRET"],
    callbackUrl: `${APP_URL}/api/analytics/callback/facebook`,
    steps: [
      {
        title: "Crear app en Meta for Developers",
        items: [
          "Ve a developers.facebook.com/apps e inicia sesión",
          'Clic en "Crear app" → Tipo: Empresa → Siguiente',
          'Nombre: MarketPro Analytics → "Crear app"',
          "Ve a Configuración → Básica",
          "Copia el ID de la app → META_APP_ID",
          'Clic en "Mostrar" en Clave secreta → cópiala → META_APP_SECRET',
        ],
      },
      {
        title: "Agregar Facebook Login",
        items: [
          'Panel lateral → "Agregar producto" → "Facebook Login" → Configurar',
          'Selecciona "Web"',
          "En URI de redireccionamiento OAuth válidos pega la URL de callback (botón Copiar arriba)",
          "Clic Guardar cambios",
        ],
      },
      {
        title: "Permisos necesarios",
        items: [
          "Revisión de la app → Permisos y funciones",
          "Activa: pages_read_engagement, instagram_basic, instagram_manage_insights, read_insights, ads_read",
          "En modo desarrollo solo funciona con tu propio usuario — está bien para pruebas",
        ],
      },
    ],
  },
  {
    key: "google",
    label: "Google (YouTube + Ads)",
    color: "#4285f4",
    bgColor: "#e8f0fe",
    portalUrl: "https://console.cloud.google.com",
    portalLabel: "console.cloud.google.com",
    envVars: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_DEVELOPER_TOKEN"],
    callbackUrl: `${APP_URL}/api/analytics/callback/google`,
    steps: [
      {
        title: "Crear proyecto en Google Cloud",
        items: [
          "Ve a console.cloud.google.com",
          'Selector de proyecto (arriba izquierda) → "Nuevo proyecto"',
          'Nombre: MarketPro Analytics → Crear',
        ],
      },
      {
        title: "Activar APIs necesarias",
        items: [
          'Panel lateral → "APIs y servicios" → "Biblioteca"',
          "Busca y activa: YouTube Data API v3",
          "Busca y activa: YouTube Analytics API",
          "Busca y activa: Google Ads API",
        ],
      },
      {
        title: "Crear credenciales OAuth",
        items: [
          '"APIs y servicios" → "Credenciales" → "+ Crear credenciales" → "ID de cliente OAuth"',
          "Si pide configurar pantalla: Tipo Externo → nombre MarketPro → guarda",
          'Tipo de aplicación: "Aplicación web" → Nombre: MarketPro Web',
          "En URI de redireccionamiento autorizados pega la URL de callback",
          "Clic Crear → copia ID de cliente (GOOGLE_CLIENT_ID) y Secreto (GOOGLE_CLIENT_SECRET)",
        ],
      },
      {
        title: "Google Ads Developer Token",
        items: [
          "Ve a ads.google.com con cuenta de administrador",
          "Herramientas → Configuración → Centro de API",
          "Copia el Token de desarrollador → GOOGLE_DEVELOPER_TOKEN",
        ],
      },
    ],
  },
  {
    key: "tiktok",
    label: "TikTok",
    color: "#010101",
    bgColor: "#f5f5f5",
    portalUrl: "https://developers.tiktok.com",
    portalLabel: "developers.tiktok.com",
    envVars: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"],
    callbackUrl: `${APP_URL}/api/analytics/callback/tiktok`,
    steps: [
      {
        title: "Crear app en TikTok for Developers",
        items: [
          "Ve a developers.tiktok.com con cuenta TikTok de empresa",
          'Clic en "My Apps" → "Create App"',
          'App Name: MarketPro → App Type: Web',
          "En Redirect URI pega la URL de callback",
        ],
      },
      {
        title: "Activar permisos (Scopes)",
        items: [
          "En la configuración de la app activa:",
          "user.info.basic",
          "video.list",
          "business.get",
        ],
      },
      {
        title: "Obtener credenciales",
        items: [
          "Ve a App Detail de tu app",
          "Copia Client Key → TIKTOK_CLIENT_KEY",
          "Copia Client Secret → TIKTOK_CLIENT_SECRET",
        ],
      },
    ],
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    color: "#0077b5",
    bgColor: "#e8f4f9",
    portalUrl: "https://www.linkedin.com/developers/apps",
    portalLabel: "linkedin.com/developers",
    envVars: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"],
    callbackUrl: `${APP_URL}/api/analytics/callback/linkedin`,
    steps: [
      {
        title: "Crear app en LinkedIn Developers",
        items: [
          "Ve a linkedin.com/developers/apps (debes ser admin de la página de empresa)",
          'Clic "Create app"',
          "App name: MarketPro → selecciona tu LinkedIn Page → sube un logo → Create app",
        ],
      },
      {
        title: "Configurar OAuth",
        items: [
          'Ve a la tab "Auth"',
          "En Authorized redirect URLs pega la URL de callback",
          "Copia Client ID → LINKEDIN_CLIENT_ID",
          "Copia Client Secret → LINKEDIN_CLIENT_SECRET",
        ],
      },
      {
        title: "Solicitar permisos",
        items: [
          'Ve a la tab "Products"',
          "Solicita acceso a: Marketing Developer Platform",
          "Solicita acceso a: Share on LinkedIn",
        ],
      },
    ],
  },
  {
    key: "resend",
    label: "Resend (envío de emails)",
    color: "#000000",
    bgColor: "#f5f5f5",
    portalUrl: "https://resend.com",
    portalLabel: "resend.com",
    envVars: ["RESEND_API_KEY", "RESEND_FROM_EMAIL"],
    callbackUrl: "",
    steps: [
      {
        title: "Crear cuenta y API Key",
        items: [
          "Ve a resend.com → crea cuenta gratuita",
          'Dashboard → "API Keys" → "Create API Key"',
          "Nombre: MarketPro → copia la key → RESEND_API_KEY",
        ],
      },
      {
        title: "Verificar dominio",
        items: [
          'Dashboard → "Domains" → "Add Domain"',
          "Agrega: progresa-group.cl",
          "Agrega los registros DNS que te indica Resend en tu proveedor de dominio",
          "RESEND_FROM_EMAIL = informes@progresa-group.cl",
        ],
      },
    ],
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
    >
      {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}

function SetupGuideCard({ guide }: { guide: typeof setupGuides[0] }) {
  const [open, setOpen] = useState(false);
  const [stepOpen, setStepOpen] = useState<number | null>(0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: guide.color }}
          >
            {guide.label.charAt(0)}
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-900 text-sm">{guide.label}</p>
            <p className="text-xs text-gray-400">{guide.envVars.join(" · ")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={guide.portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            <ExternalLink size={11} />
            {guide.portalLabel}
          </a>
          {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 p-5 space-y-4">

          {/* Callback URL */}
          {guide.callbackUrl && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-600 mb-2">URL de Callback / Redirect URI</p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-xs text-gray-800 bg-white border border-gray-200 rounded px-2 py-1.5 flex-1 truncate">
                  {guide.callbackUrl}
                </code>
                <CopyButton text={guide.callbackUrl} />
              </div>
            </div>
          )}

          {/* Env vars needed */}
          <div className="bg-yellow-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-yellow-800 mb-2">Variables de entorno a completar en .env</p>
            <div className="space-y-1">
              {guide.envVars.map((v) => (
                <div key={v} className="flex items-center justify-between">
                  <code className="text-xs text-yellow-900 font-mono">{v}=&quot;tu-valor-aqui&quot;</code>
                  <CopyButton text={`${v}=""`} />
                </div>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-2">
            {guide.steps.map((step, i) => (
              <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setStepOpen(stepOpen === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full text-xs font-bold text-white flex items-center justify-center"
                      style={{ backgroundColor: guide.color }}>
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-800">{step.title}</span>
                  </div>
                  {stepOpen === i ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                </button>
                {stepOpen === i && (
                  <div className="px-4 pb-4 pt-1">
                    <ol className="space-y-2">
                      {step.items.map((item, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs text-gray-600">
                          <span className="mt-0.5 w-4 h-4 rounded-full bg-gray-100 text-gray-500 text-xs flex items-center justify-center shrink-0 font-medium">
                            {j + 1}
                          </span>
                          {item}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const { activeClient } = useClient();
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState(false);

  const fetchConnections = useCallback(async () => {
    if (!activeClient) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/connections?clientId=${activeClient.id}`);
      const data = await res.json();
      setConnections(data.connections || []);
    } catch {
      setConnections([]);
    } finally {
      setLoading(false);
    }
  }, [activeClient]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  async function handleDisconnect(id: string) {
    if (!confirm("¿Desconectar esta cuenta?")) return;
    setDisconnecting(id);
    try {
      await fetch(`/api/analytics/connections/${id}`, { method: "DELETE" });
      fetchConnections();
    } finally {
      setDisconnecting(null);
    }
  }

  function handleConnect(platformKey: string) {
    if (!activeClient) {
      alert("Selecciona un cliente primero.");
      return;
    }
    window.location.href = `/api/analytics/connect/${platformKey}?clientId=${activeClient.id}`;
  }

  const connectedMap: Record<string, SocialConnection[]> = {};
  connections.forEach((c) => {
    if (!connectedMap[c.platform]) connectedMap[c.platform] = [];
    connectedMap[c.platform].push(c);
  });

  const totalConnected = connections.length;

  return (
    <div className="p-6 space-y-6">
      <Header title="Analítica" subtitle="Conecta tus redes sociales y monitorea todas tus métricas en un solo lugar" />

      {!activeClient && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
          Selecciona un cliente activo para gestionar sus conexiones de analítica.
        </div>
      )}

      {/* Setup banner */}
      {totalConnected === 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-orange-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-orange-800">Configura las credenciales para conectar</p>
            <p className="text-xs text-orange-700 mt-0.5">
              Antes de conectar cada plataforma necesitas crear una app en su portal de desarrolladores y agregar las credenciales al archivo <code className="bg-orange-100 px-1 rounded">.env</code>.
            </p>
          </div>
          <button
            onClick={() => setShowSetup((v) => !v)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ backgroundColor: "#FFC207", color: "#000" }}
          >
            <BookOpen size={13} />
            {showSetup ? "Ocultar guía" : "Ver guía de configuración"}
          </button>
        </div>
      )}

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#FFC207" }}>
              <CheckCircle2 size={18} className="text-black" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Cuentas conectadas</p>
              <p className="text-2xl font-bold text-gray-900">{totalConnected}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <TrendingUp size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Plataformas disponibles</p>
              <p className="text-2xl font-bold text-gray-900">{platforms.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Users size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total seguidores</p>
              <p className="text-2xl font-bold text-gray-900">—</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Eye size={18} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Alcance total</p>
              <p className="text-2xl font-bold text-gray-900">—</p>
            </div>
          </div>
        </div>
      </div>

      {/* Platform connections grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">Conexiones de plataformas</h2>
          <button
            onClick={() => setShowSetup((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
          >
            <BookOpen size={13} />
            Guía de configuración
          </button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {platforms.map((platform) => {
              const platformConnections = connectedMap[platform.key] || [];
              const isConnected = platformConnections.length > 0;

              return (
                <div key={platform.key} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: platform.bgColor, color: platform.color }}
                      >
                        {platform.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{platform.label}</h3>
                        {isConnected ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle2 size={11} /> Conectado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                            <XCircle size={11} /> No conectado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mb-4">{platform.description}</p>

                  {isConnected && (
                    <div className="space-y-2 mb-3">
                      {platformConnections.map((conn) => (
                        <div key={conn.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: platform.color }}>
                              {conn.accountName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-medium text-gray-700 truncate max-w-[120px]">{conn.accountName}</span>
                          </div>
                          <button
                            onClick={() => handleDisconnect(conn.id)}
                            disabled={disconnecting === conn.id}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            title="Desconectar"
                          >
                            {disconnecting === conn.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Unlink size={14} />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {isConnected && (
                      <a
                        href={`/analytics/${platform.key}`}
                        className="flex-1 text-center text-xs font-semibold py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Ver métricas
                      </a>
                    )}
                    <button
                      onClick={() => handleConnect(platform.key)}
                      disabled={!activeClient}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold py-2 rounded-lg text-black transition-all disabled:opacity-40"
                      style={{ backgroundColor: "#FFC207" }}
                    >
                      <Plus size={13} />
                      {isConnected ? "Agregar cuenta" : "Conectar"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Setup Guide */}
      {showSetup && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <BookOpen size={18} className="text-gray-600" />
            <h2 className="text-base font-semibold text-gray-800">Guía de configuración paso a paso</h2>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800">
            <strong>Cómo funciona:</strong> Para cada plataforma debes (1) crear una app en su portal de desarrolladores,
            (2) copiar las credenciales al archivo <code className="bg-blue-100 px-1 rounded">.env</code> del proyecto,
            y (3) reiniciar el servidor con <code className="bg-blue-100 px-1 rounded">npm run dev</code>.
            Las URLs de callback ya están configuradas — solo cópialas.
          </div>

          <div className="space-y-3">
            {setupGuides.map((guide) => (
              <SetupGuideCard key={guide.key} guide={guide} />
            ))}
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-700 mb-2">Archivo .env — resumen de todas las variables</p>
            <pre className="text-xs text-gray-600 font-mono leading-relaxed overflow-x-auto">
{`META_APP_ID="tu-app-id"
META_APP_SECRET="tu-app-secret"

GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxx"
GOOGLE_DEVELOPER_TOKEN="tu-developer-token"

TIKTOK_CLIENT_KEY="tu-client-key"
TIKTOK_CLIENT_SECRET="tu-client-secret"

LINKEDIN_CLIENT_ID="tu-client-id"
LINKEDIN_CLIENT_SECRET="tu-client-secret"

RESEND_API_KEY="re_xxxxxxxxxxxxx"
RESEND_FROM_EMAIL="informes@progresa-group.cl"`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
