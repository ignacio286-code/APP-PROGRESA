"use client";

import Header from "@/components/Header";
import { useEffect, useState } from "react";
import { Key, Eye, EyeOff, Save, CheckCircle, AlertCircle, Share2 } from "lucide-react";

interface ApiKeys {
  ANTHROPIC_API_KEY: string;
  MONDAY_API_TOKEN: string;
  RESEND_API_KEY: string;
  META_APP_ID: string;
  META_APP_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_DEVELOPER_TOKEN: string;
  TIKTOK_CLIENT_KEY: string;
  TIKTOK_CLIENT_SECRET: string;
  LINKEDIN_CLIENT_ID: string;
  LINKEDIN_CLIENT_SECRET: string;
}

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [keys, setKeys] = useState<ApiKeys>({
    ANTHROPIC_API_KEY: "",
    MONDAY_API_TOKEN: "",
    RESEND_API_KEY: "",
    META_APP_ID: "",
    META_APP_SECRET: "",
    GOOGLE_CLIENT_ID: "",
    GOOGLE_CLIENT_SECRET: "",
    GOOGLE_DEVELOPER_TOKEN: "",
    TIKTOK_CLIENT_KEY: "",
    TIKTOK_CLIENT_SECRET: "",
    LINKEDIN_CLIENT_ID: "",
    LINKEDIN_CLIENT_SECRET: "",
  });
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [savingKeys, setSavingKeys] = useState(false);
  const [keySaved, setKeySaved] = useState(false);
  const [keyError, setKeyError] = useState("");

  useEffect(() => {
    fetch("/api/settings/keys")
      .then((r) => r.json())
      .then((data) => setKeys(data))
      .catch(() => {});
  }, []);

  async function handleSaveKeys(e: React.FormEvent) {
    e.preventDefault();
    setSavingKeys(true);
    setKeyError("");
    try {
      const res = await fetch("/api/settings/keys", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(keys),
      });
      if (res.ok) {
        setKeySaved(true);
        setTimeout(() => setKeySaved(false), 3000);
        // Reload keys to get masked versions
        const data = await fetch("/api/settings/keys").then((r) => r.json());
        setKeys(data);
      } else {
        setKeyError("Error al guardar las claves");
      }
    } catch {
      setKeyError("Error de conexión");
    }
    setSavingKeys(false);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function toggleShow(key: string) {
    setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const keyFields = [
    {
      key: "ANTHROPIC_API_KEY",
      label: "Anthropic API Key (Claude IA)",
      desc: "Necesaria para SEO con IA, generación de contenido y optimización. Obtener en console.anthropic.com",
      placeholder: "sk-ant-api03-...",
    },
    {
      key: "MONDAY_API_TOKEN",
      label: "Monday.com API Token",
      desc: "Para sincronizar leads, propuestas, servicios y hosting desde Monday.com. Obtener en monday.com > Developers",
      placeholder: "eyJhbGciOiJIUzI1NiJ9...",
    },
    {
      key: "RESEND_API_KEY",
      label: "Resend API Key (Email)",
      desc: "Para enviar notificaciones por correo cuando llegan leads del formulario web. Obtener en resend.com",
      placeholder: "re_...",
    },
  ];

  const socialKeyGroups = [
    {
      platform: "Meta (Facebook / Instagram)",
      fields: [
        {
          key: "META_APP_ID",
          label: "Meta App ID",
          desc: "ID de la aplicacion de Meta. Obtener en developers.facebook.com > My Apps",
          placeholder: "123456789012345",
        },
        {
          key: "META_APP_SECRET",
          label: "Meta App Secret",
          desc: "Secret de la aplicacion de Meta. Obtener en developers.facebook.com > My Apps > Settings > Basic",
          placeholder: "abc123def456...",
        },
      ],
    },
    {
      platform: "Google (YouTube / Google Ads)",
      fields: [
        {
          key: "GOOGLE_CLIENT_ID",
          label: "Google Client ID",
          desc: "OAuth 2.0 Client ID. Obtener en console.cloud.google.com > APIs & Services > Credentials",
          placeholder: "123456789-abc.apps.googleusercontent.com",
        },
        {
          key: "GOOGLE_CLIENT_SECRET",
          label: "Google Client Secret",
          desc: "OAuth 2.0 Client Secret. Obtener en console.cloud.google.com > APIs & Services > Credentials",
          placeholder: "GOCSPX-...",
        },
        {
          key: "GOOGLE_DEVELOPER_TOKEN",
          label: "Google Ads Developer Token",
          desc: "Token de desarrollador para Google Ads API. Obtener en ads.google.com > Tools > API Center",
          placeholder: "AbCdEfGhIjKlMnOp",
        },
      ],
    },
    {
      platform: "TikTok",
      fields: [
        {
          key: "TIKTOK_CLIENT_KEY",
          label: "TikTok Client Key",
          desc: "Client Key de la app de TikTok. Obtener en developers.tiktok.com > My Apps",
          placeholder: "abc123def456...",
        },
        {
          key: "TIKTOK_CLIENT_SECRET",
          label: "TikTok Client Secret",
          desc: "Client Secret de la app de TikTok. Obtener en developers.tiktok.com > My Apps",
          placeholder: "abc123def456...",
        },
      ],
    },
    {
      platform: "LinkedIn",
      fields: [
        {
          key: "LINKEDIN_CLIENT_ID",
          label: "LinkedIn Client ID",
          desc: "Client ID de la app de LinkedIn. Obtener en developer.linkedin.com > My Apps",
          placeholder: "abc123def456",
        },
        {
          key: "LINKEDIN_CLIENT_SECRET",
          label: "LinkedIn Client Secret",
          desc: "Client Secret de la app de LinkedIn. Obtener en developer.linkedin.com > My Apps",
          placeholder: "abc123def456...",
        },
      ],
    },
  ];

  return (
    <div>
      <Header title="Configuración" subtitle="Ajustes de la plataforma" />
      <div className="p-6 max-w-2xl space-y-6">

        {/* API Keys */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-1">
            <Key size={18} className="text-yellow-500" />
            <h2 className="text-sm font-bold text-gray-900">Claves API e Integraciones</h2>
          </div>
          <p className="text-xs text-gray-400 mb-5">Configura las claves necesarias para que los módulos de la plataforma funcionen correctamente.</p>

          <form onSubmit={handleSaveKeys} className="space-y-4">
            {keyFields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                </label>
                <p className="text-xs text-gray-400 mb-1.5">{field.desc}</p>
                <div className="relative">
                  <input
                    type={showKeys[field.key] ? "text" : "password"}
                    value={keys[field.key as keyof ApiKeys] || ""}
                    onChange={(e) =>
                      setKeys((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    placeholder={field.placeholder}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShow(field.key)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showKeys[field.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {keys[field.key as keyof ApiKeys] && keys[field.key as keyof ApiKeys].includes("......") && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle size={12} /> Configurada
                  </p>
                )}
              </div>
            ))}

            {/* Social Media API Keys Section */}
            <div className="border-t border-gray-200 pt-5 mt-5">
              <div className="flex items-center gap-2 mb-1">
                <Share2 size={18} className="text-blue-500" />
                <h3 className="text-sm font-bold text-gray-900">Conexiones de Redes Sociales</h3>
              </div>
              <p className="text-xs text-gray-400 mb-5">Claves API para conectar plataformas de redes sociales y publicidad digital.</p>

              {socialKeyGroups.map((group) => (
                <div key={group.platform} className="mb-5">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{group.platform}</h4>
                  <div className="space-y-4">
                    {group.fields.map((field) => (
                      <div key={field.key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {field.label}
                        </label>
                        <p className="text-xs text-gray-400 mb-1.5">{field.desc}</p>
                        <div className="relative">
                          <input
                            type={showKeys[field.key] ? "text" : "password"}
                            value={keys[field.key as keyof ApiKeys] || ""}
                            onChange={(e) =>
                              setKeys((prev) => ({ ...prev, [field.key]: e.target.value }))
                            }
                            placeholder={field.placeholder}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => toggleShow(field.key)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showKeys[field.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {keys[field.key as keyof ApiKeys] && keys[field.key as keyof ApiKeys].includes("......") && (
                          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <CheckCircle size={12} /> Configurada
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {keyError && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle size={16} /> {keyError}
              </div>
            )}

            <button
              type="submit"
              disabled={savingKeys}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-black hover:opacity-90 disabled:opacity-60 transition"
              style={{ backgroundColor: "#FFC207" }}
            >
              <Save size={16} />
              {savingKeys ? "Guardando..." : keySaved ? "✓ Claves Guardadas" : "Guardar Claves API"}
            </button>
          </form>
        </div>

        {/* Company */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Información de la empresa</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre empresa</label>
                <input defaultValue="Progresa Agencia" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sitio web</label>
                <input defaultValue="https://agencia-de-marketing.cl" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email de contacto</label>
              <input type="email" defaultValue="contacto@agenciaprogresa.cl" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
            </div>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-sm font-semibold text-black hover:opacity-90"
              style={{ backgroundColor: "#FFC207" }}
            >
              {saved ? "✓ Guardado" : "Guardar cambios"}
            </button>
          </form>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Notificaciones</h2>
          <div className="space-y-3">
            {[
              { label: "Nuevo lead desde formulario web", desc: "Notificar por email cuando llegue un lead" },
              { label: "Campaña iniciada", desc: "Notificar cuando una campaña comience" },
              { label: "Presupuesto al 80%", desc: "Alerta cuando el gasto llegue al 80%" },
              { label: "Campaña finalizada", desc: "Notificar cuando una campaña termine" },
            ].map((n) => (
              <div key={n.label} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{n.label}</p>
                  <p className="text-xs text-gray-400">{n.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-yellow-400 transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
                </label>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
