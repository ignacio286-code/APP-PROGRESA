"use client";

import Header from "@/components/Header";
import { useClient } from "@/lib/client-context";
import { AlertCircle, CheckCircle2, ExternalLink, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Step {
  title: string;
  description: string;
}

function Guide({ title, steps, color }: { title: string; steps: Step[]; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-900 mb-4" style={{ color }}>{title}</h3>
      <ol className="space-y-3">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
              style={{ backgroundColor: color }}
            >
              {i + 1}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{step.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

const metaSteps: Step[] = [
  { title: "Accede a Meta for Developers", description: "Ve a developers.facebook.com y crea una nueva app con el tipo 'Business'" },
  { title: "Agrega el producto Ads Management", description: "En tu app, ve a 'Add Products' y agrega 'Marketing API'" },
  { title: "Configura los permisos", description: "Solicita: ads_management, ads_read, business_management, pages_read_engagement" },
  { title: "Genera el Access Token", description: "Usa el Graph API Explorer para generar un token de larga duración con los permisos requeridos" },
  { title: "Obtén el Ad Account ID", description: "Ve a business.facebook.com → Cuentas de anuncios → copia el ID (formato: act_XXXXXXXXX)" },
  { title: "Guarda las credenciales", description: "Edita el cliente en Gestión de Clientes y completa los campos de Meta Business" },
];

const googleSteps: Step[] = [
  { title: "Activa la Google Ads API", description: "En console.cloud.google.com, crea un proyecto y habilita 'Google Ads API'" },
  { title: "Crea credenciales OAuth 2.0", description: "En Credenciales → Crear credenciales → ID de cliente OAuth. Tipo: 'Aplicación de escritorio'" },
  { title: "Solicita Developer Token", description: "En Google Ads → Herramientas → Centro de API → solicita acceso de prueba o producción" },
  { title: "Autenticación OAuth2", description: "Usa el OAuth Playground para obtener el refresh_token con scope: https://www.googleapis.com/auth/adwords" },
  { title: "Obtén el Customer ID", description: "En tu cuenta de Google Ads, el Customer ID aparece en la esquina superior derecha (formato: XXX-XXX-XXXX)" },
  { title: "Guarda las credenciales", description: "Edita el cliente en Gestión de Clientes y completa los campos de Google Ads" },
];

export default function PaidMediaConnectionsPage() {
  const { activeClient } = useClient();

  const metaConfigured = !!(activeClient?.metaAccessToken && activeClient?.metaAdAccountId);
  const googleConfigured = !!(activeClient?.googleClientId && activeClient?.googleDeveloperToken);

  return (
    <div>
      <Header title="Configurar Conexiones" subtitle="Guía para conectar Meta Business y Google Ads" />

      <div className="p-6 space-y-6">
        {/* Status bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              platform: "Meta Business",
              configured: metaConfigured,
              href: "/paid-media/meta",
              color: "#1877f2",
            },
            {
              platform: "Google Ads",
              configured: googleConfigured,
              href: "/paid-media/google",
              color: "#ea4335",
            },
          ].map(({ platform, configured, href, color }) => (
            <div key={platform} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {configured ? (
                  <CheckCircle2 size={20} className="text-green-500" />
                ) : (
                  <AlertCircle size={20} className="text-gray-400" />
                )}
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{platform}</p>
                  <p className={`text-xs ${configured ? "text-green-600" : "text-gray-400"}`}>
                    {configured ? "Configurado correctamente" : "Sin configurar"}
                  </p>
                </div>
              </div>
              {configured && (
                <Link
                  href={href}
                  className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
                  style={{ backgroundColor: color }}
                >
                  Crear campaña <ChevronRight size={12} />
                </Link>
              )}
            </div>
          ))}
        </div>

        {!activeClient && (
          <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <AlertCircle size={20} className="text-yellow-600 shrink-0" />
            <p className="text-sm text-yellow-700">Selecciona un cliente activo. Las credenciales se guardan por cliente.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Meta Business</h2>
              <a
                href="https://developers.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                Meta for Developers <ExternalLink size={12} />
              </a>
            </div>
            <Guide title="Pasos para configurar Meta Ads API" steps={metaSteps} color="#1877f2" />

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-700 mb-2">Permisos requeridos</p>
              <div className="flex flex-wrap gap-1.5">
                {["ads_management", "ads_read", "business_management", "pages_read_engagement"].map((perm) => (
                  <code key={perm} className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{perm}</code>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Google Ads</h2>
              <a
                href="https://console.cloud.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-red-600 hover:underline"
              >
                Google Cloud Console <ExternalLink size={12} />
              </a>
            </div>
            <Guide title="Pasos para configurar Google Ads API" steps={googleSteps} color="#ea4335" />

            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-red-700 mb-2">OAuth Scope requerido</p>
              <code className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded block">
                https://www.googleapis.com/auth/adwords
              </code>
            </div>
          </div>
        </div>

        {/* Quick link to client edit */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900 text-sm">¿Listo para guardar las credenciales?</p>
            <p className="text-xs text-gray-500 mt-0.5">Ve a Gestión de Clientes → edita el cliente → completa las secciones Meta y Google Ads</p>
          </div>
          <Link
            href="/clients"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-black hover:opacity-90"
            style={{ backgroundColor: "#FFC207" }}
          >
            Ir a Clientes <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
