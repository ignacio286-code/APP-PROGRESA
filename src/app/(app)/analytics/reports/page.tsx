"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import { useClient } from "@/lib/client-context";
import {
  Loader2,
  FileBarChart2,
  Plus,
  Send,
  Trash2,
  Calendar,
  Download,
  ChevronDown,
  ChevronUp,
  Bell,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";

const ALL_PLATFORMS = [
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "youtube", label: "YouTube" },
  { key: "tiktok", label: "TikTok" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "google_ads", label: "Google Ads" },
];

const DAYS_ES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

interface Report {
  id: string;
  name: string;
  dateFrom: string;
  dateTo: string;
  platforms: string[];
  createdAt: string;
}

interface Schedule {
  id: string;
  name: string;
  frequency: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  recipients: string[];
  platforms: string[];
  isActive: boolean;
  nextSendAt?: string;
  lastSentAt?: string;
}

export default function ReportsPage() {
  const { activeClient } = useClient();
  const [reports, setReports] = useState<Report[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);

  // Report form
  const [reportName, setReportName] = useState("");
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["facebook", "instagram"]);
  const [generating, setGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<Report | null>(null);

  // Send form
  const [sendEmail, setSendEmail] = useState("");
  const [sendingReport, setSendingReport] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  // Schedule form
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [schedName, setSchedName] = useState("");
  const [schedFreq, setSchedFreq] = useState("weekly");
  const [schedDay, setSchedDay] = useState(1);
  const [schedDayOfMonth, setSchedDayOfMonth] = useState(1);
  const [schedRecipients, setSchedRecipients] = useState("");
  const [schedPlatforms, setSchedPlatforms] = useState<string[]>(["facebook", "instagram"]);
  const [savingSchedule, setSavingSchedule] = useState(false);

  const fetchData = useCallback(async () => {
    if (!activeClient) return;
    setLoading(true);
    try {
      const [rRes, sRes] = await Promise.all([
        fetch(`/api/analytics/reports/list?clientId=${activeClient.id}`),
        fetch(`/api/analytics/reports/schedule?clientId=${activeClient.id}`),
      ]);
      const [rData, sData] = await Promise.all([rRes.json(), sRes.json()]);
      setReports(rData.reports || []);
      setSchedules(sData.schedules || []);
    } finally {
      setLoading(false);
    }
  }, [activeClient]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function togglePlatform(key: string, list: string[], setList: (v: string[]) => void) {
    setList(list.includes(key) ? list.filter((p) => p !== key) : [...list, key]);
  }

  async function handleGenerate() {
    if (!activeClient || !reportName || !selectedPlatforms.length) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/analytics/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: activeClient.id,
          name: reportName,
          dateFrom,
          dateTo,
          platforms: selectedPlatforms,
        }),
      });
      const data = await res.json();
      if (data.report) {
        setGeneratedReport(data.report);
        fetchData();
        setReportName("");
      }
    } finally {
      setGenerating(false);
    }
  }

  async function handleSend(reportId: string) {
    if (!sendEmail.trim()) return;
    setSendingReport(reportId);
    setSendSuccess(null);
    try {
      const res = await fetch("/api/analytics/reports/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          recipients: sendEmail.split(",").map((e) => e.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        setSendSuccess(reportId);
        setTimeout(() => setSendSuccess(null), 3000);
      }
    } finally {
      setSendingReport(null);
    }
  }

  async function handleDeleteReport(id: string) {
    if (!confirm("¿Eliminar este informe?")) return;
    await fetch(`/api/analytics/reports/generate`, { method: "DELETE" });
    fetchData();
  }

  async function handleSaveSchedule() {
    if (!activeClient || !schedName || !schedRecipients || !schedPlatforms.length) return;
    setSavingSchedule(true);
    try {
      const body: Record<string, unknown> = {
        clientId: activeClient.id,
        name: schedName,
        frequency: schedFreq,
        recipients: schedRecipients.split(",").map((e) => e.trim()).filter(Boolean),
        platforms: schedPlatforms,
      };
      if (schedFreq === "weekly") body.dayOfWeek = schedDay;
      else body.dayOfMonth = schedDayOfMonth;

      await fetch("/api/analytics/reports/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setShowScheduleForm(false);
      setSchedName("");
      setSchedRecipients("");
      fetchData();
    } finally {
      setSavingSchedule(false);
    }
  }

  async function handleToggleSchedule(id: string, isActive: boolean) {
    await fetch(`/api/analytics/reports/schedule/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    fetchData();
  }

  async function handleDeleteSchedule(id: string) {
    if (!confirm("¿Eliminar este horario?")) return;
    await fetch(`/api/analytics/reports/schedule/${id}`, { method: "DELETE" });
    fetchData();
  }

  function handlePrint(report: Report) {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>${report.name}</title>
      <style>body{font-family:sans-serif;padding:32px;max-width:800px;margin:0 auto;}h1{color:#000;}table{width:100%;border-collapse:collapse;}td,th{border:1px solid #ddd;padding:8px;}@media print{button{display:none}}</style>
      </head><body>
      <h1>${report.name}</h1>
      <p><strong>Período:</strong> ${new Date(report.dateFrom).toLocaleDateString("es-CL")} – ${new Date(report.dateTo).toLocaleDateString("es-CL")}</p>
      <p><strong>Plataformas:</strong> ${report.platforms.join(", ")}</p>
      <p><em>Abre el informe completo desde la app para ver todos los datos.</em></p>
      <button onclick="window.print()">Imprimir / Guardar PDF</button>
      </body></html>
    `);
    win.document.close();
    win.print();
  }

  return (
    <div className="p-6 space-y-6">
      <Header title="Informes de Analítica" subtitle="Genera, descarga y programa el envío automático de informes" />

      {!activeClient && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
          Selecciona un cliente activo para gestionar informes.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Generate report ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <FileBarChart2 size={18} className="text-gray-600" />
            <h2 className="font-semibold text-gray-800">Generar informe</h2>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Nombre del informe</label>
            <input
              type="text"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="Ej: Informe mensual marzo 2026"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Desde</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Hasta</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-2">Plataformas a incluir</label>
            <div className="flex flex-wrap gap-2">
              {ALL_PLATFORMS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => togglePlatform(p.key, selectedPlatforms, setSelectedPlatforms)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    selectedPlatforms.includes(p.key)
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || !activeClient || !reportName || !selectedPlatforms.length}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-black transition-all disabled:opacity-40"
            style={{ backgroundColor: "#FFC207" }}
          >
            {generating ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            {generating ? "Generando..." : "Generar informe"}
          </button>

          {generatedReport && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 flex items-center gap-2">
              <CheckCircle2 size={15} />
              Informe <strong>{generatedReport.name}</strong> generado correctamente.
            </div>
          )}
        </div>

        {/* ── Send by email ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Send size={18} className="text-gray-600" />
            <h2 className="font-semibold text-gray-800">Enviar informe por email</h2>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Destinatarios (separados por coma)</label>
            <input
              type="text"
              value={sendEmail}
              onChange={(e) => setSendEmail(e.target.value)}
              placeholder="email1@example.com, email2@example.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          <p className="text-xs text-gray-500">Selecciona un informe de la lista y haz clic en el ícono de envío.</p>

          {loading ? (
            <div className="flex justify-center py-6"><Loader2 size={24} className="animate-spin text-gray-300" /></div>
          ) : reports.length === 0 ? (
            <div className="text-center py-6 text-sm text-gray-400">No hay informes generados aún.</div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {reports.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="text-sm font-medium text-gray-800 truncate">{r.name}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(r.dateFrom).toLocaleDateString("es-CL")} – {new Date(r.dateTo).toLocaleDateString("es-CL")} · {r.platforms.length} plataforma(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => handlePrint(r)} title="Descargar PDF" className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors">
                      <Download size={15} />
                    </button>
                    <button
                      onClick={() => handleSend(r.id)}
                      disabled={sendingReport === r.id || !sendEmail.trim()}
                      title="Enviar por email"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-40"
                    >
                      {sendingReport === r.id ? <Loader2 size={15} className="animate-spin" /> : sendSuccess === r.id ? <CheckCircle2 size={15} className="text-green-500" /> : <Send size={15} />}
                    </button>
                    <button onClick={() => handleDeleteReport(r.id)} title="Eliminar" className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Automated schedules ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-gray-600" />
            <h2 className="font-semibold text-gray-800">Envíos automáticos</h2>
          </div>
          <button
            onClick={() => setShowScheduleForm(!showScheduleForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-black"
            style={{ backgroundColor: "#FFC207" }}
          >
            {showScheduleForm ? <ChevronUp size={13} /> : <Plus size={13} />}
            {showScheduleForm ? "Cancelar" : "Nuevo horario"}
          </button>
        </div>

        {/* Schedule form */}
        {showScheduleForm && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-4 border border-gray-200">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Nombre del horario</label>
                <input type="text" value={schedName} onChange={(e) => setSchedName(e.target.value)}
                  placeholder="Ej: Informe semanal"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Frecuencia</label>
                <select value={schedFreq} onChange={(e) => setSchedFreq(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white">
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensual</option>
                </select>
              </div>
              {schedFreq === "weekly" && (
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Día de la semana</label>
                  <select value={schedDay} onChange={(e) => setSchedDay(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white">
                    {DAYS_ES.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
              )}
              {schedFreq === "monthly" && (
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Día del mes</label>
                  <input type="number" min={1} max={28} value={schedDayOfMonth} onChange={(e) => setSchedDayOfMonth(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white" />
                </div>
              )}
              <div className="lg:col-span-2">
                <label className="text-xs font-medium text-gray-600 block mb-1">Destinatarios (separados por coma)</label>
                <input type="text" value={schedRecipients} onChange={(e) => setSchedRecipients(e.target.value)}
                  placeholder="email@ejemplo.com, otro@ejemplo.com"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white" />
              </div>
              <div className="lg:col-span-2">
                <label className="text-xs font-medium text-gray-600 block mb-2">Plataformas a incluir</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_PLATFORMS.map((p) => (
                    <button key={p.key} onClick={() => togglePlatform(p.key, schedPlatforms, setSchedPlatforms)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        schedPlatforms.includes(p.key) ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                      }`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={handleSaveSchedule} disabled={savingSchedule || !schedName || !schedRecipients || !schedPlatforms.length}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-black disabled:opacity-40"
              style={{ backgroundColor: "#FFC207" }}>
              {savingSchedule ? <Loader2 size={14} className="animate-spin" /> : <Calendar size={14} />}
              Guardar horario
            </button>
          </div>
        )}

        {/* Schedules list */}
        {schedules.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-400">
            No hay envíos automáticos configurados. Crea uno para empezar.
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${s.isActive ? "bg-green-400" : "bg-gray-300"}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{s.name}</p>
                    <p className="text-xs text-gray-500">
                      {s.frequency === "weekly" ? `Semanal · ${DAYS_ES[s.dayOfWeek || 0]}` : `Mensual · día ${s.dayOfMonth}`}
                      {" · "}{s.recipients.length} destinatario(s)
                      {" · "}{s.platforms.length} plataforma(s)
                    </p>
                    {s.nextSendAt && (
                      <p className="text-xs text-gray-400">Próximo envío: {new Date(s.nextSendAt).toLocaleDateString("es-CL")}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <button onClick={() => handleToggleSchedule(s.id, s.isActive)} title={s.isActive ? "Pausar" : "Activar"}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors">
                    {s.isActive ? <XCircle size={15} /> : <RefreshCw size={15} />}
                  </button>
                  <button onClick={() => handleDeleteSchedule(s.id)} title="Eliminar"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 size={15} />
                  </button>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {s.isActive ? "Activo" : "Pausado"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
