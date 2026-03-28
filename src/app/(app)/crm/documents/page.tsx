"use client";

import { useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import { Plus, Save, Trash2, FileText, Edit2, X, Loader2, Download, Upload, Link2 } from "lucide-react";

const DEFAULT_TC = `Términos y Condiciones:
Trabajo sujeto a un contrato por 6 meses renovables automáticamente por el mismo periodo. En caso de querer dar término al contrato, se debe avisar con 30 días de anticipación, vía correo electrónico, para servicio de Redes Sociales, SEO y SEM. Este contrato comienza a regir cuando se acepta la presente cotización.

En cuanto al desarrollo de Páginas Web, el proceso es de 1 a 2 meses, y el tiempo corre cuando nos envían toda la información. Una vez mostrado el avance final, tiene sólo una instancia para realizar todas las modificaciones que se requieran en base a la información enviada. Toda modificación adicional a la solicitada tendrá un costo extra.

Condiciones de Pago: El caso de servicios de SEO, SEM y Redes Sociales, se cancela al momento de comenzar el proyecto.

En caso de Desarrollo de páginas web se cancela 50% por concepto de anticipo y el otro 50% se cancela al momento de la entrega del proyecto.

Los canales de comunicación son por correo o por grupo whatsapp, se generan 1 - 3 reuniones mensuales, dependiendo de los requerimientos. Informes se entregan luego de 30 días. Horario de atención: 9:00 - 19:00.`;

interface Doc {
  id: string;
  title: string;
  content?: string;
  fileUrl?: string;
  fileType?: string;
  fileData?: string;
  fileName?: string;
  updatedAt: string;
}

const FILE_TYPE_ICON: Record<string, string> = {
  text: "📝", pdf: "📄", word: "📘", link: "🔗",
};

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [selected, setSelected] = useState<Doc | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileType, setFileType] = useState("text");
  const [fileData, setFileData] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch("/api/crm/documents");
    if (!res.ok) return;
    const text = await res.text();
    if (!text) return;
    let data: Doc[];
    try { data = JSON.parse(text); } catch { return; }
    setDocs(data);
    if (data.length === 0 && !initialized) {
      setInitialized(true);
      const r = await fetch("/api/crm/documents", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Términos y Condiciones", content: DEFAULT_TC, fileType: "text" }),
      });
      if (!r.ok) return;
      try { const doc = await r.json(); setDocs([doc]); selectDoc(doc); } catch { return; }
    } else if (data.length > 0 && !selected) {
      selectDoc(data[0]);
    }
  }

  function selectDoc(doc: Doc) {
    setSelected(doc); setEditing(false); setTitle(doc.title);
    setContent(doc.content || ""); setFileUrl(doc.fileUrl || "");
    setFileType(doc.fileType || "text"); setFileData(doc.fileData || null);
    setFileName(doc.fileName || ""); setIsNew(false);
  }

  function startNew() {
    setSelected(null); setEditing(true); setTitle(""); setContent("");
    setFileUrl(""); setFileType("text"); setFileData(null); setFileName(""); setIsNew(true);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") setFileType("pdf");
    else if (ext === "doc" || ext === "docx") setFileType("word");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setFileData(result.split(",")[1]);
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    const body = {
      title,
      content: fileType === "text" ? content : undefined,
      fileUrl: fileType === "link" ? fileUrl : undefined,
      fileType, fileData: fileData || undefined,
      fileName: fileName || undefined,
    };
    let doc: Doc;
    if (isNew || !selected) {
      const r = await fetch("/api/crm/documents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      doc = await r.json();
      setDocs(prev => [doc, ...prev]);
    } else {
      const r = await fetch(`/api/crm/documents/${selected.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      doc = await r.json();
      setDocs(prev => prev.map(d => d.id === doc.id ? doc : d));
    }
    setSaving(false); setEditing(false); setIsNew(false); setSelected(doc);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este documento?")) return;
    await fetch(`/api/crm/documents/${id}`, { method: "DELETE" });
    const remaining = docs.filter(d => d.id !== id);
    setDocs(remaining);
    if (selected?.id === id) { setSelected(null); setEditing(false); }
    if (remaining.length > 0) selectDoc(remaining[0]);
  }

  function downloadFile(doc: Doc) {
    if (!doc.fileData) return;
    const mimeMap: Record<string, string> = { pdf: "application/pdf", word: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
    const mime = mimeMap[doc.fileType || ""] || "application/octet-stream";
    const bytes = Uint8Array.from(atob(doc.fileData), c => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = doc.fileName || doc.title; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header title="Documentación Progresa" subtitle="Gestiona documentos, términos y archivos" />
      <main className="flex-1 flex overflow-hidden" style={{ height: "calc(100vh - 80px)" }}>

        {/* Left panel */}
        <div className="w-72 shrink-0 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <button onClick={startNew} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-black" style={{ backgroundColor: "#FFC207" }}>
              <Plus size={15} /> Nuevo Documento
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {docs.length === 0 && <p className="text-xs text-gray-400 text-center py-8">Sin documentos</p>}
            {docs.map(doc => (
              <button key={doc.id} onClick={() => selectDoc(doc)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition group ${selected?.id === doc.id ? "bg-yellow-50 border border-yellow-200" : "hover:bg-gray-50"}`}>
                <div className="flex items-start gap-2">
                  <span className="text-base shrink-0">{FILE_TYPE_ICON[doc.fileType || "text"] || "📝"}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${selected?.id === doc.id ? "text-yellow-700" : "text-gray-800"}`}>{doc.title}</p>
                    <p className="text-xs text-gray-400">{new Date(doc.updatedAt).toLocaleDateString("es-CL")}</p>
                    {doc.fileName && <p className="text-xs text-blue-500 truncate">{doc.fileName}</p>}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 text-gray-400 transition">
                    <Trash2 size={12} />
                  </button>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selected && !editing ? (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <FileText size={40} className="mx-auto mb-3 text-gray-200" />
                <p className="text-gray-400">Selecciona un documento o crea uno nuevo</p>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3 shrink-0 flex-wrap">
                {editing ? (
                  <>
                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título del documento"
                      className="flex-1 text-lg font-semibold bg-transparent border-0 focus:outline-none text-gray-900 min-w-0" />
                    <select value={fileType} onChange={e => { setFileType(e.target.value); setFileData(null); setFileName(""); }}
                      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none">
                      <option value="text">📝 Texto</option>
                      <option value="pdf">📄 PDF</option>
                      <option value="word">📘 Word</option>
                      <option value="link">🔗 Enlace</option>
                    </select>
                    <button onClick={handleSave} disabled={saving || !title.trim()}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-black disabled:opacity-60"
                      style={{ backgroundColor: "#FFC207" }}>
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      {saving ? "Guardando..." : "Guardar"}
                    </button>
                    <button onClick={() => { setEditing(false); if (isNew) setSelected(null); }} className="p-1.5 rounded hover:bg-gray-100">
                      <X size={16} className="text-gray-500" />
                    </button>
                  </>
                ) : (
                  <>
                    <p className="flex-1 text-lg font-semibold text-gray-900 truncate">{selected?.title}</p>
                    <span className="text-xs text-gray-400">{FILE_TYPE_ICON[selected?.fileType || "text"]} {selected?.fileType}</span>
                    <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50">
                      <Edit2 size={14} /> Editar
                    </button>
                    {selected?.fileData && (
                      <button onClick={() => downloadFile(selected!)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100">
                        <Download size={14} /> Descargar
                      </button>
                    )}
                  </>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {editing ? (
                  <div className="max-w-3xl mx-auto space-y-4">
                    {(fileType === "pdf" || fileType === "word") && (
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                        <Upload size={32} className="mx-auto mb-3 text-gray-300" />
                        <p className="text-sm text-gray-500 mb-3">{fileType === "pdf" ? "Sube un archivo PDF" : "Sube un archivo Word (.docx)"}</p>
                        {fileName && <p className="text-sm font-medium text-green-600 mb-3">✓ {fileName}</p>}
                        <button onClick={() => fileRef.current?.click()}
                          className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700">
                          {fileName ? "Cambiar archivo" : "Seleccionar archivo"}
                        </button>
                        <input ref={fileRef} type="file" accept={fileType === "pdf" ? ".pdf" : ".doc,.docx"} className="hidden" onChange={handleFileUpload} />
                      </div>
                    )}
                    {fileType === "link" && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">URL del documento</label>
                        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
                          <Link2 size={15} className="text-gray-400 shrink-0" />
                          <input value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="https://drive.google.com/..."
                            className="flex-1 text-sm focus:outline-none" />
                        </div>
                      </div>
                    )}
                    {fileType === "text" && (
                      <textarea value={content} onChange={e => setContent(e.target.value)} rows={22}
                        placeholder="Escribe el contenido del documento aquí..."
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none font-mono leading-relaxed" />
                    )}
                  </div>
                ) : (
                  <div className="max-w-3xl mx-auto">
                    {selected?.fileType === "text" && (
                      <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed bg-white rounded-xl border border-gray-100 p-6">{selected.content}</pre>
                    )}
                    {(selected?.fileType === "pdf" || selected?.fileType === "word") && (
                      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                        <span className="text-5xl">{FILE_TYPE_ICON[selected.fileType!]}</span>
                        <p className="text-gray-700 font-semibold mt-4">{selected.fileName || selected.title}</p>
                        <p className="text-sm text-gray-400 mt-1">Archivo {selected.fileType!.toUpperCase()} adjunto</p>
                        {selected.fileData && (
                          <button onClick={() => downloadFile(selected)} className="mt-4 flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 mx-auto">
                            <Download size={15} /> Descargar {selected.fileType!.toUpperCase()}
                          </button>
                        )}
                      </div>
                    )}
                    {selected?.fileType === "link" && selected.fileUrl && (
                      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                        <span className="text-5xl">🔗</span>
                        <p className="text-gray-700 font-semibold mt-4">{selected.title}</p>
                        <a href={selected.fileUrl} target="_blank" rel="noopener noreferrer"
                          className="mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100">
                          <Link2 size={15} /> Abrir enlace
                        </a>
                      </div>
                    )}
                    {!selected?.content && !selected?.fileData && !selected?.fileUrl && (
                      <div className="text-center py-16 text-gray-400">Sin contenido</div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
