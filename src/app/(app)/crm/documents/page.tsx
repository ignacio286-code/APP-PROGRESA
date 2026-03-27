"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Plus, Save, Trash2, FileText, Edit2, X, Loader2 } from "lucide-react";

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
  updatedAt: string;
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [selected, setSelected] = useState<Doc | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileType, setFileType] = useState("text");
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch("/api/crm/documents");
    if (!res.ok) return;
    const text = await res.text();
    if (!text) return;
    let data: Doc[];
    try { data = JSON.parse(text); } catch { return; }
    setDocs(data);
    // Auto-create T&C if no docs exist
    if (data.length === 0 && !initialized) {
      setInitialized(true);
      const r = await fetch("/api/crm/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Términos y Condiciones", content: DEFAULT_TC, fileType: "text" }),
      });
      if (!r.ok) return;
      try {
        const doc = await r.json();
        setDocs([doc]);
        selectDoc(doc);
      } catch { return; }
    } else if (data.length > 0 && !selected) {
      selectDoc(data[0]);
    }
  }

  function selectDoc(doc: Doc) {
    setSelected(doc);
    setTitle(doc.title);
    setContent(doc.content || "");
    setFileUrl(doc.fileUrl || "");
    setFileType(doc.fileType || "text");
    setEditing(false);
    setIsNew(false);
  }

  function newDoc() {
    setSelected(null);
    setTitle("");
    setContent("");
    setFileUrl("");
    setFileType("text");
    setEditing(true);
    setIsNew(true);
  }

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const body = { title, content: content || null, fileUrl: fileUrl || null, fileType };
      if (isNew) {
        const res = await fetch("/api/crm/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const doc = await res.json();
        setDocs(prev => [doc, ...prev]);
        selectDoc(doc);
      } else if (selected) {
        const res = await fetch(`/api/crm/documents/${selected.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const doc = await res.json();
        setDocs(prev => prev.map(d => d.id === doc.id ? doc : d));
        selectDoc(doc);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este documento?")) return;
    await fetch(`/api/crm/documents/${id}`, { method: "DELETE" });
    const remaining = docs.filter(d => d.id !== id);
    setDocs(remaining);
    if (remaining.length > 0) selectDoc(remaining[0]);
    else { setSelected(null); setTitle(""); setContent(""); }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header title="Documentación Progresa" subtitle="Guarda documentos, términos y condiciones" />
      <main className="flex-1 flex overflow-hidden" style={{ height: "calc(100vh - 73px)" }}>

        {/* Sidebar list */}
        <div className="w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-3 border-b border-gray-100">
            <button onClick={newDoc}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold text-black"
              style={{ backgroundColor: "#FFC207" }}>
              <Plus size={15} /> Nuevo documento
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {docs.map(doc => (
              <button key={doc.id} onClick={() => selectDoc(doc)}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 flex items-start gap-2 hover:bg-gray-50 transition-colors ${selected?.id === doc.id ? "bg-yellow-50 border-l-2 border-l-yellow-400" : ""}`}>
                <FileText size={15} className="shrink-0 mt-0.5 text-gray-400" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                  <p className="text-xs text-gray-400">{new Date(doc.updatedAt).toLocaleDateString("es-CL")}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {(selected || isNew) ? (
            <>
              {/* Editor toolbar */}
              <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between gap-3">
                {editing ? (
                  <input value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="Título del documento"
                    className="flex-1 text-lg font-bold border-0 outline-none focus:ring-0 bg-transparent" />
                ) : (
                  <h2 className="text-lg font-bold text-gray-900 truncate">{title}</h2>
                )}
                <div className="flex items-center gap-2 shrink-0">
                  {!editing && (
                    <button onClick={() => setEditing(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <Edit2 size={13} /> Editar
                    </button>
                  )}
                  {editing && (
                    <>
                      <button onClick={() => { if (!isNew && selected) selectDoc(selected); else { setIsNew(false); setEditing(false); } }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <X size={13} /> Cancelar
                      </button>
                      <button onClick={handleSave} disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-black rounded-lg disabled:opacity-60"
                        style={{ backgroundColor: "#FFC207" }}>
                        {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                        Guardar
                      </button>
                    </>
                  )}
                  {!isNew && selected && (
                    <button onClick={() => handleDelete(selected.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>

              {/* Type selector */}
              {editing && (
                <div className="bg-gray-50 border-b border-gray-200 px-5 py-2 flex items-center gap-4">
                  <span className="text-xs font-medium text-gray-500">Tipo:</span>
                  {["text", "pdf", "word", "link"].map(t => (
                    <label key={t} className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input type="radio" name="fileType" value={t} checked={fileType === t}
                        onChange={() => setFileType(t)} className="accent-yellow-400" />
                      <span className="capitalize">{t === "link" ? "Enlace" : t === "text" ? "Texto" : t.toUpperCase()}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Content area */}
              <div className="flex-1 overflow-y-auto p-5">
                {fileType === "text" ? (
                  editing ? (
                    <textarea value={content} onChange={e => setContent(e.target.value)}
                      className="w-full h-full min-h-96 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none font-mono"
                      placeholder="Escribe el contenido del documento..." />
                  ) : (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed min-h-96">
                      {content || <span className="text-gray-400 italic">Sin contenido</span>}
                    </div>
                  )
                ) : (
                  <div className="space-y-4">
                    {editing ? (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {fileType === "link" ? "URL del enlace" : `URL del archivo ${fileType.toUpperCase()}`}
                        </label>
                        <input value={fileUrl} onChange={e => setFileUrl(e.target.value)}
                          placeholder="https://drive.google.com/..."
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                        <p className="text-xs text-gray-400 mt-1">Puedes pegar un enlace de Google Drive, Dropbox u otra fuente.</p>
                      </div>
                    ) : fileUrl ? (
                      <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <FileText size={24} className="text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">{title}</p>
                            <p className="text-xs text-gray-400">{fileType.toUpperCase()}</p>
                          </div>
                        </div>
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-black rounded-lg"
                          style={{ backgroundColor: "#FFC207" }}>
                          Abrir archivo
                        </a>
                      </div>
                    ) : (
                      <p className="text-gray-400 italic">Sin URL configurada. Edita para agregar.</p>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-6">
              <div>
                <FileText size={48} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 font-medium">Selecciona un documento</p>
                <p className="text-sm text-gray-400 mt-1">o crea uno nuevo con el botón amarillo</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
