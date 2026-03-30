"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { useClient } from "@/lib/client-context";
import {
  FileText, Loader2, AlertCircle, CheckCircle2, Send,
  RefreshCw, Mail, Globe, Download, BarChart2, Search,
  ShoppingBag, Tag, Sparkles, Printer,
} from "lucide-react";

interface WpSeoItem {
  id: number;
  title: string;
  type: "page" | "product" | "category";
  focusKeyword: string;
  seoTitle: string;
  metaDescription: string;
  score: number | null;
  link: string;
}

interface Report {
  clientName: string;
  date: string;
  wpUrl: string;
  summary: string;
  items: WpSeoItem[];
  totalPages: number;
  totalProducts: number;
  optimized: number;
  pending: number;
}

export default function SeoReportsPage() {
  const { activeClient } = useClient();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState("");
  const [generating, setGenerating] = useState(false);
  const [aiSummary, setAiSummary] = useState("");

  const hasWp = !!(activeClient?.wpUrl && activeClient?.wpUsername && activeClient?.wpAppPassword);

  async function loadReport() {
    if (!hasWp) return;
    setLoading(true); setError(null); setReport(null); setAiSummary("");
    try {
      // Load pages
      const [pagesRes, productsRes] = await Promise.allSettled([
        fetch("/api/wordpress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wpUrl: activeClient!.wpUrl,
            wpUsername: activeClient!.wpUsername,
            wpAppPassword: activeClient!.wpAppPassword,
            endpoint: "pages?per_page=100&context=edit&_fields=id,title,link,status,meta",
            apiNamespace: "wp/v2",
            method: "GET",
          }),
        }).then(r => r.json()),
        fetch("/api/wordpress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wpUrl: activeClient!.wpUrl,
            wpUsername: activeClient!.wpUsername,
            wpAppPassword: activeClient!.wpAppPassword,
            endpoint: "products?per_page=100&_fields=id,name,permalink,status,meta_data",
            apiNamespace: "wc/v3",
            method: "GET",
          }),
        }).then(r => r.json()),
      ]);

      const items: WpSeoItem[] = [];

      if (pagesRes.status === "fulfilled") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pages: any[] = pagesRes.value._data || pagesRes.value;
        if (Array.isArray(pages)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pages.forEach((p: any) => {
            const meta = p.meta || {};
            const seoTitle = meta.rank_math_title || "";
            const metaDescription = meta.rank_math_description || "";
            const focusKeyword = meta.rank_math_focus_keyword || "";
            let score: number | null = null;
            if (seoTitle || metaDescription || focusKeyword) {
              score = 0;
              if (focusKeyword) score += 10;
              if (seoTitle && focusKeyword && seoTitle.toLowerCase().includes(focusKeyword.toLowerCase())) score += 15;
              if (metaDescription && focusKeyword && metaDescription.toLowerCase().includes(focusKeyword.toLowerCase())) score += 15;
              if (seoTitle.length >= 40 && seoTitle.length <= 60) score += 10;
              if (metaDescription.length >= 120 && metaDescription.length <= 160) score += 10;
              score = Math.min(score, 100);
            }
            items.push({
              id: p.id,
              title: (typeof p.title === "object" ? p.title?.rendered : p.title) || "(sin título)",
              type: "page",
              focusKeyword, seoTitle, metaDescription, score,
              link: p.link || "",
            });
          });
        }
      }

      if (productsRes.status === "fulfilled") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const prods: any[] = productsRes.value._data || productsRes.value;
        if (Array.isArray(prods)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          prods.forEach((p: any) => {
            const metaArr: { key: string; value: string }[] = p.meta_data || [];
            const getMeta = (key: string) => metaArr.find(m => m.key === key)?.value || "";
            const seoTitle = getMeta("rank_math_title");
            const metaDescription = getMeta("rank_math_description");
            const focusKeyword = getMeta("rank_math_focus_keyword");
            let score: number | null = null;
            if (seoTitle || metaDescription || focusKeyword) {
              score = 0;
              if (focusKeyword) score += 10;
              if (seoTitle && focusKeyword && seoTitle.toLowerCase().includes(focusKeyword.toLowerCase())) score += 15;
              if (metaDescription && focusKeyword && metaDescription.toLowerCase().includes(focusKeyword.toLowerCase())) score += 15;
              if (seoTitle.length >= 40 && seoTitle.length <= 60) score += 10;
              if (metaDescription.length >= 120 && metaDescription.length <= 160) score += 10;
              score = Math.min(score, 100);
            }
            items.push({
              id: p.id,
              title: p.name || "(sin nombre)",
              type: "product",
              focusKeyword, seoTitle, metaDescription, score,
              link: p.permalink || "",
            });
          });
        }
      }

      const optimized = items.filter(i => i.score !== null && i.score >= 50).length;
      const pending = items.filter(i => i.score === null || i.score < 50).length;

      setReport({
        clientName: activeClient!.name,
        date: new Date().toLocaleDateString("es-CL", { year: "numeric", month: "long", day: "numeric" }),
        wpUrl: activeClient!.wpUrl || "",
        summary: "",
        items,
        totalPages: items.filter(i => i.type === "page").length,
        totalProducts: items.filter(i => i.type === "product").length,
        optimized,
        pending,
      });
    } catch (err) {
      setError(String(err));
    } finally { setLoading(false); }
  }

  async function generateAISummary() {
    if (!report) return;
    setGenerating(true);
    try {
      const topIssues = report.items.filter(i => !i.focusKeyword).slice(0, 5).map(i => i.title).join(", ");
      const res = await fetch("/api/seo/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: report.items.slice(0, 5).map(i => ({
            id: i.id, title: i.title, type: i.type, link: i.link,
          })),
          instructions: "Genera un resumen ejecutivo del estado SEO para el informe al cliente. Sé profesional y constructivo.",
          clientName: report.clientName,
        }),
      });
      const data = await res.json();
      if (data.results) {
        setAiSummary(
          `Informe SEO generado para ${report.clientName}. ` +
          `Total de elementos analizados: ${report.items.length}. ` +
          `Optimizados (score ≥50): ${report.optimized}. ` +
          `Pendientes de optimización: ${report.pending}. ` +
          (topIssues ? `Páginas/productos sin keyword definida: ${topIssues}. ` : "") +
          `Se recomienda continuar con el posicionamiento masivo para completar los elementos pendientes.`
        );
      }
    } finally { setGenerating(false); }
  }

  async function sendEmail() {
    if (!recipientEmail || !report) return;
    setSending(true); setSendMsg("");
    try {
      const res = await fetch("/api/seo/reports/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail,
          clientName: report.clientName,
          reportDate: report.date,
          wpUrl: report.wpUrl,
          summary: aiSummary,
          stats: {
            total: report.items.length,
            optimized: report.optimized,
            pending: report.pending,
            pages: report.totalPages,
            products: report.totalProducts,
          },
          items: report.items.slice(0, 20),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSendMsg("✓ Informe enviado por email correctamente");
    } catch (err) {
      setSendMsg("Error: " + String(err));
    } finally { setSending(false); }
  }

  function printReport() {
    window.print();
  }

  const scoreColor = (s: number | null) => {
    if (s === null) return "bg-gray-100 text-gray-400";
    if (s >= 80) return "bg-green-100 text-green-700";
    if (s >= 50) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-600";
  };

  if (!activeClient) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header title="Informes SEO" subtitle="Genera y envía informes SEO a tus clientes" />
        <main className="flex-1 p-6">
          <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <AlertCircle size={20} className="text-yellow-600" />
            <p className="text-sm text-yellow-700">Selecciona un cliente activo primero.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header title="Informes SEO" subtitle="Genera y envía informes de posicionamiento a tus clientes" />
      <main className="flex-1 p-4 md:p-6 space-y-5 print:p-0 print:space-y-4">

        {/* Actions bar — hidden in print */}
        <div className="flex flex-wrap items-center gap-3 print:hidden">
          <button onClick={loadReport} disabled={loading || !hasWp}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-black disabled:opacity-50"
            style={{ backgroundColor: "#FFC207" }}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {loading ? "Cargando datos..." : "Generar informe"}
          </button>
          {report && (
            <>
              <button onClick={generateAISummary} disabled={generating}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50">
                {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} style={{ color: "#b8860b" }} />}
                Resumen IA
              </button>
              <button onClick={printReport}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 bg-white hover:bg-gray-50">
                <Printer size={14} className="text-gray-500" />Imprimir / PDF
              </button>
            </>
          )}
        </div>

        {!hasWp && (
          <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl print:hidden">
            <AlertCircle size={18} className="text-orange-500 shrink-0" />
            <p className="text-sm text-orange-700">El cliente no tiene WordPress configurado.</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl print:hidden">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {report && (
          <>
            {/* Report header */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-xl font-black text-gray-900">Informe SEO — {report.clientName}</h1>
                  <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                    <Globe size={14} />
                    <a href={report.wpUrl} target="_blank" rel="noopener noreferrer" className="hover:underline print:no-underline">{report.wpUrl}</a>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Generado el {report.date}</p>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-black font-black text-xl" style={{ backgroundColor: "#FFC207" }}>
                  {report.clientName.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total analizados", value: report.items.length, icon: <BarChart2 size={16} className="text-blue-500" /> },
                  { label: "Optimizados (≥50)", value: report.optimized, icon: <CheckCircle2 size={16} className="text-green-500" /> },
                  { label: "Pendientes", value: report.pending, icon: <AlertCircle size={16} className="text-red-500" /> },
                  { label: "Páginas / Productos", value: `${report.totalPages} / ${report.totalProducts}`, icon: <FileText size={16} className="text-purple-500" /> },
                ].map(s => (
                  <div key={s.label} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">{s.icon}<p className="text-xs text-gray-500">{s.label}</p></div>
                    <p className="text-xl font-bold text-gray-900">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* AI Summary */}
              {aiSummary && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs font-bold text-blue-700 mb-1 flex items-center gap-1">
                    <Sparkles size={12} />Resumen ejecutivo
                  </p>
                  <p className="text-sm text-blue-800">{aiSummary}</p>
                </div>
              )}
            </div>

            {/* Items table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                <Search size={15} className="text-gray-400" />
                <h2 className="font-semibold text-gray-900">Detalle por elemento</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Título</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Keyword</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Título SEO</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Score</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase print:hidden">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.items.map((item) => (
                      <tr key={`${item.type}-${item.id}`} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-2.5">
                          <span className="flex items-center gap-1.5 text-xs text-gray-500">
                            {item.type === "page" ? <Globe size={12} /> : item.type === "product" ? <ShoppingBag size={12} /> : <Tag size={12} />}
                            {item.type === "page" ? "Página" : item.type === "product" ? "Producto" : "Categoría"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <p className="text-sm font-medium text-gray-800 truncate max-w-[180px]">{item.title}</p>
                        </td>
                        <td className="px-4 py-2.5 text-xs">
                          {item.focusKeyword
                            ? <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{item.focusKeyword}</span>
                            : <span className="text-red-400">Sin keyword</span>}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-400 hidden md:table-cell max-w-[200px] truncate">
                          {item.seoTitle || <span className="text-red-400">Sin título SEO</span>}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`inline-flex items-center justify-center w-14 h-6 rounded text-xs font-bold ${scoreColor(item.score)}`}>
                            {item.score !== null ? `${item.score}` : "N/A"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center print:hidden">
                          {item.score === null || item.score < 50
                            ? <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Pendiente</span>
                            : <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Optimizado</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Send by email */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 print:hidden">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Mail size={16} className="text-blue-500" />Enviar informe por email
              </h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={e => setRecipientEmail(e.target.value)}
                  placeholder="Email del cliente (ej: cliente@empresa.com)"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                <button onClick={sendEmail} disabled={sending || !recipientEmail}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-black disabled:opacity-50 shrink-0"
                  style={{ backgroundColor: "#FFC207" }}>
                  {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {sending ? "Enviando..." : "Enviar informe"}
                </button>
              </div>
              {sendMsg && (
                <p className={`mt-2 text-sm ${sendMsg.startsWith("Error") ? "text-red-600" : "text-green-600"}`}>{sendMsg}</p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                Se enviará un informe HTML con el resumen y detalle del estado SEO de cada elemento.
                Requiere <code className="text-xs bg-gray-100 px-1 rounded">RESEND_API_KEY</code> configurado.
              </p>
            </div>

            {/* Download info */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg print:hidden">
              <Download size={15} className="text-gray-400 shrink-0" />
              <p className="text-xs text-gray-500">Para descargar como PDF: click en "Imprimir / PDF" → selecciona "Guardar como PDF" en el diálogo de impresión.</p>
            </div>
          </>
        )}

        {!report && !loading && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <FileText size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="text-gray-500 font-medium">Genera el informe SEO</p>
            <p className="text-sm text-gray-400 mt-1">Haz click en "Generar informe" para analizar el estado SEO de todas las páginas y productos.</p>
          </div>
        )}
      </main>
    </div>
  );
}
