"use client";

import { useState, useRef, useEffect } from "react";
import Header from "@/components/Header";
import { useClient } from "@/lib/client-context";
import {
  Cpu, AlertCircle, Loader2, Send, Copy, Check,
  FileText, ShoppingBag, RefreshCw, MessageSquare,
  Bot, User, CheckCircle2, ExternalLink, Sparkles,
} from "lucide-react";

interface GeneratedContent {
  title?: string;
  metaTitle?: string;
  metaDescription?: string;
  content?: string;
  shortDescription?: string;
  longDescription?: string;
  slug?: string;
  excerpt?: string;
  tags?: string[];
  raw?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatParams {
  keyword: string;
  type: string;
  audience: string;
  objective: string;
  tone: string;
  wordCount: number;
  destination: "new" | { id: number; wpType: string };
}

interface PublishResult {
  postId: number;
  postLink: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  schema: string;
}

export default function SeoContentPage() {
  const { activeClient } = useClient();
  const [activeTab, setActiveTab] = useState<"classic" | "chat">("classic");

  // ── Classic tab state ──────────────────────────────────────────────────────
  const [type, setType] = useState<"article" | "product">("article");
  const [keyword, setKeyword] = useState("");
  const [title, setTitle] = useState("");
  const [tone, setTone] = useState("profesional");
  const [wordCount, setWordCount] = useState(800);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState("");

  // ── Chat tab state ─────────────────────────────────────────────────────────
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatReady, setChatReady] = useState(false);
  const [chatParams, setChatParams] = useState<ChatParams | null>(null);
  const [publishingChat, setPublishingChat] = useState(false);
  const [publishStage, setPublishStage] = useState("");
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Start chat with a welcome message
  useEffect(() => {
    if (activeTab === "chat" && chatMessages.length === 0) {
      setChatMessages([{
        role: "assistant",
        content: `👋 ¡Hola! Soy tu asistente SEO. Te voy a ayudar a posicionar una página en Google usando WordPress y RankMath.\n\n¿Cuál es la **palabra clave** que quieres posicionar?`,
      }]);
    }
  }, [activeTab, chatMessages.length]);

  // ── Classic tab functions ──────────────────────────────────────────────────
  async function generate() {
    if (!keyword.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/seo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, keyword, title, tone, wordCount, clientName: activeClient?.name }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function publishToWordPress(status: "publish" | "draft") {
    if (!result || !activeClient?.wpUrl) return;
    setPublishing(true);
    setPublishMsg("");
    try {
      const body: Record<string, string> = {
        title: result.title || keyword,
        status,
        content: result.content || result.longDescription || "",
        excerpt: result.excerpt || result.shortDescription || "",
      };
      const endpoint = type === "product" ? "products" : "posts";
      const res = await fetch("/api/wordpress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wpUrl: activeClient.wpUrl,
          wpUsername: activeClient.wpUsername,
          wpAppPassword: activeClient.wpAppPassword,
          endpoint,
          method: "POST",
          body,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPublishMsg(status === "publish" ? "✓ Publicado en WordPress" : "✓ Guardado como borrador en WordPress");
    } catch (err) {
      setPublishMsg("Error: " + String(err));
    } finally {
      setPublishing(false);
    }
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  // ── Chat tab functions ─────────────────────────────────────────────────────
  async function sendChatMessage(e?: React.FormEvent) {
    e?.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg: ChatMessage = { role: "user", content: chatInput };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/seo/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          clientName: activeClient?.name,
        }),
      });
      const data = await res.json();

      const assistantMsg: ChatMessage = { role: "assistant", content: data.reply };
      setChatMessages([...newMessages, assistantMsg]);

      if (data.ready && data.params) {
        setChatReady(true);
        setChatParams(data.params);
      }
    } catch {
      setChatMessages([...newMessages, { role: "assistant", content: "❌ Error al conectar con la IA. Por favor intenta de nuevo." }]);
    } finally {
      setChatLoading(false);
    }
  }

  async function handlePublishFromChat() {
    if (!chatParams || !activeClient?.wpUrl) return;
    setPublishingChat(true);
    setPublishResult(null);

    try {
      setPublishStage("✍️ Generando contenido optimizado...");
      await new Promise((r) => setTimeout(r, 300));

      setPublishStage("🔧 Configurando RankMath...");
      const res = await fetch("/api/seo/publish-with-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wpUrl: activeClient.wpUrl,
          wpUsername: activeClient.wpUsername,
          wpAppPassword: activeClient.wpAppPassword,
          keyword: chatParams.keyword,
          type: chatParams.type,
          audience: chatParams.audience,
          objective: chatParams.objective,
          tone: chatParams.tone,
          wordCount: chatParams.wordCount,
          clientName: activeClient.name,
          destination: chatParams.destination,
        }),
      });

      setPublishStage("📤 Publicando en WordPress...");
      const data = await res.json();

      if (data.error) throw new Error(data.error);
      setPublishResult(data);

      // Add success message to chat
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `✅ ¡Listo! El contenido ha sido publicado en WordPress como **borrador**.\n\n**"${data.title}"** fue creado y configurado con:\n- 🎯 Keyword: ${data.focusKeyword}\n- 📊 Schema: ${data.schema}\n- 🏷️ Meta title y descripción optimizados\n\nRevísalo en tu WordPress para publicarlo cuando quieras.`,
        },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: `❌ Error al publicar: ${String(err)}` },
      ]);
    } finally {
      setPublishingChat(false);
      setPublishStage("");
    }
  }

  function resetChat() {
    setChatMessages([]);
    setChatReady(false);
    setChatParams(null);
    setPublishResult(null);
    setChatInput("");
  }

  return (
    <div>
      <Header title="Generador de Contenido SEO" subtitle="Artículos y descripciones optimizadas con IA" />

      <div className="p-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("classic")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "classic" ? "border-yellow-400 text-black" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Cpu size={15} /> Generador clásico
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "chat" ? "border-yellow-400 text-black" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <MessageSquare size={15} /> Chat SEO
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800 font-bold">NUEVO</span>
          </button>
        </div>

        {/* ── CLASSIC TAB ── */}
        {activeTab === "classic" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left panel */}
            <div className="lg:col-span-2 space-y-4">
              {!activeClient && (
                <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <AlertCircle size={16} className="text-yellow-600 shrink-0" />
                  <p className="text-xs text-yellow-700">Selecciona un cliente activo para publicar directamente en WordPress.</p>
                </div>
              )}

              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Tipo de contenido</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { val: "article", label: "Artículo / Blog", icon: FileText },
                      { val: "product", label: "Producto", icon: ShoppingBag },
                    ].map(({ val, label, icon: Icon }) => (
                      <button
                        key={val}
                        onClick={() => setType(val as "article" | "product")}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                          type === val ? "border-yellow-400 text-black" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                        style={type === val ? { backgroundColor: "#FFC20720" } : {}}
                      >
                        <Icon size={14} />{label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Palabra clave principal *</label>
                  <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="ej: zapatos deportivos para correr"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título sugerido (opcional)</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="La IA generará uno si lo dejas vacío"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tono</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  >
                    {["profesional", "amigable", "persuasivo", "informativo", "urgente", "aspiracional"].map((t) => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>

                {type === "article" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Extensión (~{wordCount} palabras)</label>
                    <input
                      type="range" min={400} max={2000} step={100} value={wordCount}
                      onChange={(e) => setWordCount(Number(e.target.value))}
                      className="w-full accent-yellow-400"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1"><span>400</span><span>2000</span></div>
                  </div>
                )}

                <button
                  onClick={generate}
                  disabled={loading || !keyword.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: "#FFC207" }}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Cpu size={16} />}
                  {loading ? "Generando con IA..." : "Generar contenido"}
                </button>
              </div>
            </div>

            {/* Right panel */}
            <div className="lg:col-span-3">
              {error && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-4">{error}</div>}

              {loading && (
                <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-gray-200">
                  <Loader2 size={32} className="animate-spin text-yellow-500 mb-3" />
                  <p className="text-gray-500 text-sm">La IA está escribiendo tu contenido...</p>
                </div>
              )}

              {result && !loading && (
                <div className="space-y-4">
                  {(result.metaTitle || result.metaDescription) && (
                    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                      <h3 className="text-sm font-semibold text-gray-700">Metadatos SEO (RankMath)</h3>
                      {result.metaTitle && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-gray-400">Meta título ({result.metaTitle.length} chars)</p>
                            <button onClick={() => copy(result.metaTitle!, "metaTitle")} className="text-gray-400 hover:text-gray-600">
                              {copied === "metaTitle" ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                            </button>
                          </div>
                          <p className="text-sm font-medium text-gray-900 bg-gray-50 p-2 rounded-lg">{result.metaTitle}</p>
                        </div>
                      )}
                      {result.metaDescription && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-gray-400">Meta descripción ({result.metaDescription.length} chars)</p>
                            <button onClick={() => copy(result.metaDescription!, "metaDesc")} className="text-gray-400 hover:text-gray-600">
                              {copied === "metaDesc" ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                            </button>
                          </div>
                          <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded-lg">{result.metaDescription}</p>
                        </div>
                      )}
                      {result.tags && result.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {result.tags.map((tag) => (
                            <span key={tag} className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-700">
                        {result.title || (type === "article" ? "Artículo generado" : "Descripción de producto")}
                      </h3>
                      <div className="flex gap-2">
                        <button onClick={() => copy(result.content || result.longDescription || "", "content")}
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600">
                          {copied === "content" ? <Check size={12} className="text-green-500" /> : <Copy size={12} />} Copiar
                        </button>
                        <button onClick={generate} className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600">
                          <RefreshCw size={12} /> Regenerar
                        </button>
                      </div>
                    </div>
                    {result.shortDescription && (
                      <p className="text-sm text-gray-600 italic bg-blue-50 p-3 rounded-lg mb-3">{result.shortDescription}</p>
                    )}
                    <div
                      className="prose prose-sm max-w-none text-gray-700 text-sm"
                      dangerouslySetInnerHTML={{ __html: (result.content || result.longDescription || "").replace(/\n/g, "<br/>") }}
                    />
                  </div>

                  {activeClient?.wpUrl && (
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Publicar en WordPress</h3>
                      {publishMsg && (
                        <p className={`text-sm mb-3 font-medium ${publishMsg.includes("Error") ? "text-red-600" : "text-green-600"}`}>{publishMsg}</p>
                      )}
                      <div className="flex gap-3">
                        <button onClick={() => publishToWordPress("draft")} disabled={publishing}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 disabled:opacity-50">
                          {publishing ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />} Guardar borrador
                        </button>
                        <button onClick={() => publishToWordPress("publish")} disabled={publishing}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
                          style={{ backgroundColor: "#FFC207" }}>
                          {publishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Publicar ahora
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!result && !loading && (
                <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-dashed border-gray-200">
                  <Cpu size={32} className="text-gray-300 mb-3" />
                  <p className="text-gray-400 text-sm">El contenido generado aparecerá aquí</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CHAT SEO TAB ── */}
        {activeTab === "chat" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chat panel */}
            <div className="lg:col-span-2 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ height: "70vh" }}>
              {/* Chat header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#FFC207" }}>
                    <Bot size={16} className="text-black" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">SEO Bot</p>
                    <p className="text-xs text-gray-400">Asistente de posicionamiento</p>
                  </div>
                </div>
                <button onClick={resetChat} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded border border-gray-200 hover:bg-gray-100">
                  Nueva conversación
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: "#FFC207" }}>
                        <Bot size={13} className="text-black" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-black text-white rounded-br-sm"
                          : "bg-gray-100 text-gray-800 rounded-bl-sm"
                      }`}
                    >
                      {msg.content.split("\n").map((line, j) => (
                        <span key={j}>
                          {line.replace(/\*\*(.*?)\*\*/g, "$1")}
                          {j < msg.content.split("\n").length - 1 && <br />}
                        </span>
                      ))}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                        <User size={13} className="text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex gap-2 justify-start">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#FFC207" }}>
                      <Bot size={13} className="text-black" />
                    </div>
                    <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={sendChatMessage} className="flex gap-2 p-3 border-t border-gray-100">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  disabled={chatLoading || publishingChat}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || chatLoading || publishingChat}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-black disabled:opacity-40 shrink-0"
                  style={{ backgroundColor: "#FFC207" }}
                >
                  <Send size={16} />
                </button>
              </form>
            </div>

            {/* Right panel: info + publish */}
            <div className="space-y-4">
              {!activeClient && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex gap-2">
                    <AlertCircle size={15} className="text-yellow-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-800">Selecciona un cliente activo para poder publicar en WordPress.</p>
                  </div>
                </div>
              )}

              {/* How it works */}
              {!chatReady && !publishResult && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Sparkles size={15} className="text-yellow-500" /> ¿Cómo funciona?
                  </h3>
                  <ol className="space-y-2 text-xs text-gray-600">
                    {[
                      "El bot te preguntará todo lo que necesita saber",
                      "Keyword, tipo de contenido, audiencia, objetivo y tono",
                      "Confirmas los datos y haces clic en publicar",
                      "La IA genera el contenido completo optimizado",
                      "Se configura RankMath automáticamente en WordPress",
                      "El post queda como borrador listo para revisar",
                    ].map((step, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="w-5 h-5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Ready to publish card */}
              {chatReady && chatParams && !publishResult && (
                <div className="bg-white rounded-xl border border-yellow-300 p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-green-500" /> Listo para publicar
                  </h3>
                  <div className="space-y-2 text-xs">
                    {[
                      { label: "Keyword", value: chatParams.keyword },
                      { label: "Tipo", value: chatParams.type === "article" ? "Artículo de blog" : chatParams.type === "page" ? "Página" : "Producto" },
                      { label: "Audiencia", value: chatParams.audience },
                      { label: "Objetivo", value: chatParams.objective },
                      { label: "Tono", value: chatParams.tone },
                      ...(chatParams.wordCount ? [{ label: "Extensión", value: `~${chatParams.wordCount} palabras` }] : []),
                      { label: "Destino", value: chatParams.destination === "new" ? "Nueva entrada en WordPress" : `Actualizar ID ${(chatParams.destination as {id:number}).id}` },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between gap-2">
                        <span className="text-gray-500">{label}:</span>
                        <span className="font-medium text-gray-800 text-right">{value}</span>
                      </div>
                    ))}
                  </div>

                  {publishingChat ? (
                    <div className="flex flex-col items-center py-4 gap-2">
                      <Loader2 size={24} className="animate-spin text-yellow-500" />
                      <p className="text-xs text-gray-500">{publishStage}</p>
                    </div>
                  ) : (
                    <button
                      onClick={handlePublishFromChat}
                      disabled={!activeClient?.wpUrl}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-black disabled:opacity-40"
                      style={{ backgroundColor: "#FFC207" }}
                    >
                      <Send size={15} /> Generar y publicar en WordPress
                    </button>
                  )}

                  {!activeClient?.wpUrl && (
                    <p className="text-xs text-red-500 text-center">Configura las credenciales de WordPress en Clientes primero.</p>
                  )}
                </div>
              )}

              {/* Publish result */}
              {publishResult && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-green-500" />
                    <h3 className="text-sm font-semibold text-green-800">¡Publicado en WordPress!</h3>
                  </div>
                  <div className="space-y-1.5 text-xs text-green-700">
                    <p><strong>Título:</strong> {publishResult.title}</p>
                    <p><strong>Keyword:</strong> {publishResult.focusKeyword}</p>
                    <p><strong>Schema:</strong> {publishResult.schema}</p>
                    <p><strong>Estado:</strong> Borrador</p>
                  </div>
                  {publishResult.postLink && (
                    <a href={publishResult.postLink} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-green-700 underline">
                      <ExternalLink size={12} /> Ver en WordPress
                    </a>
                  )}
                  <button onClick={resetChat} className="w-full text-xs py-2 rounded-lg border border-green-300 text-green-700 hover:bg-green-100">
                    Nueva conversación
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
