"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { useClient } from "@/lib/client-context";
import {
  Globe, Search, Pencil, ExternalLink, CheckCircle2,
  XCircle, Loader2, AlertCircle, Save, FileText,
  Sparkles, X, Check, ChevronDown, ChevronUp, ShoppingBag,
  RefreshCw, Info, Copy, Tag,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
interface WpItem {
  id: number;
  title: string;
  link: string;
  status: string;
  type: "page" | "product";
  seoTitle: string;
  metaDescription: string;
  focusKeyword: string;
  schema: string;
  content: string;
}

interface AiResult {
  id: number;
  seoTitle: string;
  metaDescription: string;
  focusKeyword: string;
  schema: string;
  applied?: boolean;
}

const SCHEMA_TYPES = [
  "Article", "Product", "LocalBusiness", "WebPage",
  "FAQPage", "HowTo", "Service", "Organization", "Person",
];

// ── SEO analysis helpers ──────────────────────────────────────────────────────
const POWER_WORDS = [
  "mejor","top","gratis","nuevo","ahora","hoy","fácil","rápido","exclusivo",
  "garantizado","probado","oficial","completo","guía","secreto","esencial",
  "definitivo","increíble","poderoso","efectivo","único","especial","premium",
];

function analyzeItem(item: WpItem) {
  const kw = (item.focusKeyword.split(",")[0] || "").trim().toLowerCase();
  const rawContent = item.content || "";
  const contentText = rawContent.replace(/<[^>]*>/g, " ").toLowerCase();
  const title = item.seoTitle.toLowerCase();
  const desc = item.metaDescription.toLowerCase();
  const url = (item.link || "").toLowerCase();
  const urlPath = url.replace(/^https?:\/\/[^/]+/, "");

  const words = contentText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const kwSlug = kw.replace(/\s+/g, "-");
  const kwRegex = kw ? new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi") : null;
  const kwOccurrences = kwRegex ? (contentText.match(kwRegex) || []).length : 0;
  const density = wordCount > 0 && kwOccurrences > 0 ? (kwOccurrences / wordCount) * 100 : 0;

  const firstParagraph = contentText.slice(0, 500);
  const headingMatches = rawContent.match(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/gi) || [];
  const headingsText = headingMatches.map((h) => h.replace(/<[^>]*>/g, "").toLowerCase()).join(" ");
  const imgAlts = rawContent.match(/alt=["']([^"']*)["']/gi) || [];
  const kwInAlt = !!kw && imgAlts.some((a) => a.toLowerCase().includes(kw));
  const hasExternalLinks = /<a[^>]+href=["']https?:\/\//i.test(rawContent);
  const hasInternalLinks = /<a[^>]+href=["']\/[^"']/i.test(rawContent);
  const titleHasPowerWord = POWER_WORDS.some((pw) => title.includes(pw));
  const titleHasNumber = /\d/.test(item.seoTitle);

  return {
    kw, kwSlug, wordCount, density, kwOccurrences, urlPath,
    firstParagraph, headingsText, kwInAlt, hasExternalLinks,
    hasInternalLinks, titleHasPowerWord, titleHasNumber,
    title, desc, url,
  };
}

function calcScore(item: Pick<WpItem, "seoTitle" | "metaDescription" | "focusKeyword" | "schema" | "content" | "link">): number | null {
  const { seoTitle, metaDescription, focusKeyword } = item;
  if (!seoTitle && !metaDescription && !focusKeyword) return null;
  const a = analyzeItem(item as WpItem);
  let s = 0;
  if (a.kw) s += 5;
  if (a.kw && a.title.includes(a.kw)) s += 10;
  if (a.kw && a.desc.includes(a.kw)) s += 10;
  if (a.kw && a.url.includes(a.kwSlug)) s += 8;
  if (a.kw && a.firstParagraph.includes(a.kw)) s += 8;
  if (a.kw && a.kwOccurrences > 0) s += 8;
  if (a.wordCount >= 600) s += 10;
  if (a.kw && a.headingsText.includes(a.kw)) s += 8;
  if (a.density >= 1 && a.density <= 3) s += 5;
  if (a.hasExternalLinks) s += 5;
  if (a.hasInternalLinks) s += 5;
  if (a.titleHasPowerWord) s += 5;
  if (a.titleHasNumber) s += 5;
  if (seoTitle.length >= 40 && seoTitle.length <= 60) s += 4;
  if (metaDescription.length >= 120 && metaDescription.length <= 160) s += 4;
  return Math.min(s, 100);
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return (
    <span className="inline-flex items-center justify-center w-16 h-7 rounded text-xs font-bold bg-gray-100 text-gray-400">N/A</span>
  );
  const color = score >= 80 ? "bg-green-500" : score >= 50 ? "bg-orange-400" : "bg-red-500";
  return (
    <span className={`inline-flex items-center justify-center w-16 h-7 rounded text-xs font-bold text-white ${color}`}>
      {score} / 100
    </span>
  );
}

// ── SEO Checklist (mirrors Rank Math checks) ──────────────────────────────────
function CheckRow({ ok, label, detail }: { ok: boolean; label: string; detail?: string }) {
  return (
    <div className="flex items-start gap-2 text-xs py-1.5 border-b border-gray-50 last:border-0">
      <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${ok ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>
        {ok ? <Check size={11} strokeWidth={3} /> : <X size={11} strokeWidth={3} />}
      </span>
      <span className={ok ? "text-gray-700" : "text-gray-500"}>
        {label}
        {detail && <span className="ml-1 text-gray-400 font-mono">({detail})</span>}
      </span>
    </div>
  );
}

function SeoChecklist({ item }: { item: WpItem }) {
  const a = analyzeItem(item);
  const urlLen = a.urlPath.length;

  return (
    <div className="space-y-4">
      {/* SEO Básico */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">SEO Básico</p>
        <CheckRow ok={!!a.kw && a.title.includes(a.kw)}    label="Keyword en el título SEO" />
        <CheckRow ok={!!a.kw && a.desc.includes(a.kw)}     label="Keyword en la descripción SEO" />
        <CheckRow ok={!!a.kw && a.url.includes(a.kwSlug)}  label="Keyword en la URL" />
        <CheckRow ok={!!a.kw && a.firstParagraph.includes(a.kw)} label="Keyword al principio del contenido" />
        <CheckRow ok={!!a.kw && a.kwOccurrences > 0}       label="Keyword aparece en el contenido" detail={a.kwOccurrences > 0 ? `${a.kwOccurrences} veces` : undefined} />
        <CheckRow ok={a.wordCount >= 600}                  label="Contenido de al menos 600 palabras" detail={`${a.wordCount} palabras`} />
      </div>

      {/* Adicional */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Adicional</p>
        <CheckRow ok={!!a.kw && a.headingsText.includes(a.kw)} label="Keyword en subencabezados H2/H3/H4" />
        <CheckRow ok={a.kwInAlt}                           label="Keyword en texto alternativo de imagen" />
        <CheckRow ok={a.density >= 1 && a.density <= 3}   label="Densidad de keyword entre 1% y 3%" detail={`${a.density.toFixed(2)}%`} />
        <CheckRow ok={urlLen > 0 && urlLen <= 75}          label="URL de longitud adecuada" detail={urlLen > 0 ? `${urlLen} chars` : undefined} />
        <CheckRow ok={a.hasExternalLinks}                  label="Tiene enlaces a recursos externos" />
        <CheckRow ok={a.hasInternalLinks}                  label="Tiene enlaces internos" />
      </div>

      {/* Legibilidad del título */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Legibilidad del título</p>
        <CheckRow ok={!!a.kw && a.title.startsWith(a.kw)} label="Keyword al principio del título SEO" />
        <CheckRow ok={a.titleHasPowerWord}                 label="Título contiene una power word" />
        <CheckRow ok={a.titleHasNumber}                    label="Título contiene un número" />
        <CheckRow ok={item.seoTitle.length >= 40 && item.seoTitle.length <= 60}
                  label="Título entre 40-60 caracteres" detail={`${item.seoTitle.length} chars`} />
        <CheckRow ok={item.metaDescription.length >= 120 && item.metaDescription.length <= 160}
                  label="Descripción entre 120-160 caracteres" detail={`${item.metaDescription.length} chars`} />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SeoConnectorPage() {
  const { activeClient } = useClient();
  const [pages, setPages] = useState<WpItem[]>([]);
  const [products, setProducts] = useState<WpItem[]>([]);
  const [categories, setCategories] = useState<WpItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [tab, setTab] = useState<"pages" | "products" | "categories">("pages");

  // Edit modal (full screen)
  const [editing, setEditing] = useState<WpItem | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [rightTab, setRightTab] = useState<"rankmath" | "content" | "preview">("rankmath");

  // Single-item AI (SEO fields only — Rank Math tab)
  const [showSingleAI, setShowSingleAI] = useState(false);
  const [singleAIInst, setSingleAIInst] = useState("");
  const [singleAILoading, setSingleAILoading] = useState(false);

  // Content generation AI (Contenido tab)
  const [contentAIInst, setContentAIInst] = useState("");
  const [contentAILoading, setContentAILoading] = useState(false);

  // AI Recommendations (Rank Math tab)
  interface AiFix { check: string; issue: string; advice: string; field: string; value: string; applied?: boolean; }
  const [recLoading, setRecLoading] = useState(false);
  const [recSummary, setRecSummary] = useState("");
  const [recFixes, setRecFixes] = useState<AiFix[]>([]);
  const [recContentFull, setRecContentFull] = useState<string | null>(null);
  const [applyingAll, setApplyingAll] = useState(false);

  // Bulk AI
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showAI, setShowAI] = useState(false);
  const [aiInstructions, setAiInstructions] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState<AiResult[]>([]);
  const [applying, setApplying] = useState(false);
  const [applyMsg, setApplyMsg] = useState("");
  const [showSetup, setShowSetup] = useState(false);
  const [copied, setCopied] = useState(false);

  // Mass product/category positioning
  interface MassItemStatus {
    id: number;
    name: string;
    status: "pending" | "processing" | "done" | "error";
    error?: string;
    metaTitle?: string;
    metaDescription?: string;
    focusKeyword?: string;
  }
  const [massModalOpen, setMassModalOpen] = useState(false);
  const [massProgress, setMassProgress] = useState<MassItemStatus[]>([]);
  const [massRunning, setMassRunning] = useState(false);
  const [massDone, setMassDone] = useState(false);

  // Mass category positioning
  const [massCatModalOpen, setMassCatModalOpen] = useState(false);
  const [massCatProgress, setMassCatProgress] = useState<MassItemStatus[]>([]);
  const [massCatRunning, setMassCatRunning] = useState(false);
  const [massCatDone, setMassCatDone] = useState(false);

  const items = tab === "pages" ? pages : tab === "products" ? products : categories;

  // ── Meta cache (localStorage) ──────────────────────────────────────────────
  type MetaCache = Record<string, { seoTitle: string; metaDescription: string; focusKeyword: string; schema: string; content: string }>;

  function cacheKey() { return `seo-meta-${activeClient?.id}`; }

  function readCache(): MetaCache {
    try { return JSON.parse(localStorage.getItem(cacheKey()) || "{}"); } catch { return {}; }
  }

  function writeCache(id: number, type: string, meta: { seoTitle: string; metaDescription: string; focusKeyword: string; schema: string; content: string }) {
    try {
      const cache = readCache();
      cache[`${type}-${id}`] = meta;
      localStorage.setItem(cacheKey(), JSON.stringify(cache));
    } catch { /* ignore */ }
  }

  function mergeWithCache<T extends WpItem>(list: T[]): T[] {
    const cache = readCache();
    return list.map((item) => {
      const cached = cache[`${item.type}-${item.id}`];
      if (!cached) return item;
      return {
        ...item,
        seoTitle: item.seoTitle || cached.seoTitle,
        metaDescription: item.metaDescription || cached.metaDescription,
        focusKeyword: item.focusKeyword || cached.focusKeyword,
        schema: item.schema || cached.schema,
      };
    });
  }

  // ── WP proxy ──────────────────────────────────────────────────────────────
  async function wpFetch(endpoint: string, apiNamespace = "wp/v2", method = "GET", body?: unknown) {
    if (!activeClient) return null;
    const res = await fetch("/api/wordpress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wpUrl: activeClient.wpUrl,
        wpUsername: activeClient.wpUsername,
        wpAppPassword: activeClient.wpAppPassword,
        endpoint, apiNamespace, method, body,
      }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Error WP"); }
    return res.json();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function parseMeta(meta: any) {
    return {
      seoTitle: meta?.rank_math_title || "",
      metaDescription: meta?.rank_math_description || "",
      focusKeyword: meta?.rank_math_focus_keyword || "",
      schema: meta?.rank_math_rich_snippet || meta?.rank_math_schema || "",
    };
  }

  // ── Connect ───────────────────────────────────────────────────────────────
  async function connect() {
    if (!activeClient?.wpUrl) { setError("Configura WordPress en el cliente activo."); return; }
    setLoading(true); setError(null); setSelected(new Set());
    try {
      const [pagesRes, productsRes, catsRes] = await Promise.allSettled([
        wpFetch("pages?per_page=100&context=edit&_fields=id,title,link,status,meta"),
        wpFetch("products?per_page=100&_fields=id,name,permalink,status", "wc/v3"),
        wpFetch("products/categories?per_page=100&_fields=id,name,slug,count", "wc/v3"),
      ]);
      if (pagesRes.status === "fulfilled" && Array.isArray(pagesRes.value)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = pagesRes.value.map((p: any) => ({
          id: p.id,
          title: (typeof p.title === "object" ? p.title?.rendered : p.title) || "(sin título)",
          link: p.link || "",
          status: p.status || "publish",
          type: "page" as const,
          content: "",
          ...parseMeta(p.meta),
        }));
        setPages(mergeWithCache(raw));
      }
      if (productsRes.status === "fulfilled" && Array.isArray(productsRes.value)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = productsRes.value.map((p: any) => ({
          id: p.id,
          title: p.name || "(sin nombre)",
          link: p.permalink || "",
          status: p.status || "publish",
          type: "product" as const,
          seoTitle: "", metaDescription: "", focusKeyword: "", schema: "", content: "",
        }));
        setProducts(mergeWithCache(raw));
      } else { setProducts([]); }
      if (catsRes.status === "fulfilled" && Array.isArray(catsRes.value)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = catsRes.value.map((c: any) => ({
          id: c.id,
          title: c.name || "(sin nombre)",
          link: c.slug ? `${activeClient?.wpUrl?.replace(/\/$/, "")}/product-category/${c.slug}/` : "",
          status: "publish",
          type: "product" as const,
          seoTitle: "", metaDescription: "", focusKeyword: "", schema: "", content: "",
        }));
        setCategories(raw);
      } else { setCategories([]); }
      setConnected(true);
    } catch (err) { setError(String(err)); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (activeClient?.wpUrl) connect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeClient?.id]);

  // ── Open edit (lazy load meta) ────────────────────────────────────────────
  async function openEdit(item: WpItem) {
    setEditing({ ...item });
    setSaveMsg(""); setShowSingleAI(false); setRightTab("rankmath");
    setEditLoading(true);
    try {
      const wpType = item.type === "product" ? "product" : "pages";
      const data = await wpFetch(`${wpType}/${item.id}?context=edit`);
      if (data) {
        const meta = data.meta ? parseMeta(data.meta) : {};
        const rawContent = typeof data.content === "object" ? (data.content?.raw || "") : (data.content || "");
        // Only overwrite meta fields if the API returned actual values (avoid blanking saved data)
        const parsedMeta = meta as { seoTitle?: string; metaDescription?: string; focusKeyword?: string; schema?: string };
        setEditing((prev) => {
          if (!prev) return prev;
          const updated = {
            ...prev,
            content: rawContent,
            ...(parsedMeta.seoTitle        ? { seoTitle: parsedMeta.seoTitle }                 : {}),
            ...(parsedMeta.metaDescription ? { metaDescription: parsedMeta.metaDescription }   : {}),
            ...(parsedMeta.focusKeyword    ? { focusKeyword: parsedMeta.focusKeyword }         : {}),
            ...(parsedMeta.schema          ? { schema: parsedMeta.schema }                     : {}),
          };
          // Persist to cache so dashboard survives refresh
          writeCache(updated.id, updated.type, {
            seoTitle: updated.seoTitle, metaDescription: updated.metaDescription,
            focusKeyword: updated.focusKeyword, schema: updated.schema, content: rawContent,
          });
          return updated;
        });
      }
    } catch { /* keep empty */ }
    finally { setEditLoading(false); }
  }

  // ── Save single item ──────────────────────────────────────────────────────
  async function saveMetadata() {
    if (!editing) return;
    setSaving(true); setSaveMsg("");
    try {
      // Products: WP REST uses "product" (singular, WC post type); pages uses "pages"
      const wpType = editing.type === "product" ? "product" : "pages";
      const saved = await wpFetch(`${wpType}/${editing.id}`, "wp/v2", "POST", {
        ...(editing.content ? { content: editing.content } : {}),
        meta: {
          rank_math_title: editing.seoTitle,
          rank_math_description: editing.metaDescription,
          rank_math_focus_keyword: editing.focusKeyword,
          rank_math_rich_snippet: editing.schema,
        },
      });

      // Verify meta was actually written (Rank Math free may not register product meta for REST)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const returnedMeta: Record<string, any> = saved?.meta || {};
      const metaWritten =
        returnedMeta.rank_math_title !== undefined ||
        returnedMeta.rank_math_focus_keyword !== undefined;

      // Persist to localStorage cache so data survives page refresh
      writeCache(editing.id, editing.type, {
        seoTitle: editing.seoTitle, metaDescription: editing.metaDescription,
        focusKeyword: editing.focusKeyword, schema: editing.schema, content: editing.content,
      });
      const updater = (prev: WpItem[]) => prev.map((it) => it.id === editing.id ? { ...it, ...editing } : it);
      if (editing.type === "page") setPages(updater); else setProducts(updater);

      if (!metaWritten && editing.type === "product") {
        setSaveMsg("⚠️ Contenido guardado, pero Rank Math no acepta meta via REST para productos. Activa la REST API en Rank Math o usa Rank Math PRO.");
      } else {
        setSaveMsg("✓ Guardado en WordPress");
        setTimeout(() => { setSaveMsg(""); setEditing(null); }, 2000);
      }
    } catch (err) { setSaveMsg("Error: " + String(err)); }
    finally { setSaving(false); }
  }

  // ── Single AI ─────────────────────────────────────────────────────────────
  async function runSingleAI() {
    if (!editing || !singleAIInst.trim()) return;
    setSingleAILoading(true);
    try {
      const res = await fetch("/api/seo/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ id: editing.id, title: editing.title, type: editing.type, link: editing.link }],
          instructions: singleAIInst,
          clientName: activeClient?.name,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const r = data.results?.[0];
      if (r) setEditing((prev) => prev ? { ...prev, seoTitle: r.seoTitle, metaDescription: r.metaDescription, focusKeyword: r.focusKeyword, schema: r.schema || prev.schema } : prev);
      setShowSingleAI(false);
    } catch (err) { setSaveMsg("Error IA: " + String(err)); }
    finally { setSingleAILoading(false); }
  }

  // ── Content cleaner (fixes literal \n from AI responses) ─────────────────
  function cleanContent(raw: string): string {
    // Replace literal backslash-n sequences (model escaping artifact)
    let s = raw.replace(/\\n/g, "\n");
    // If no HTML tags → convert to HTML paragraphs
    if (!/<[a-z][\s\S]*>/i.test(s)) {
      s = s
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
        .join("\n");
    }
    return s;
  }

  // ── Content generation AI ─────────────────────────────────────────────────
  async function generateContent() {
    if (!editing || !contentAIInst.trim()) return;
    setContentAILoading(true);
    try {
      const type = editing.type === "product" ? "product" : "article";
      const res = await fetch("/api/seo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          keyword: contentAIInst,
          title: editing.title,
          clientName: activeClient?.name,
          tone: "profesional",
          wordCount: 800,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const htmlContent = cleanContent(data.content || data.longDescription || "");
      setEditing((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          content: htmlContent,
          seoTitle: data.metaTitle || data.title || prev.seoTitle,
          metaDescription: data.metaDescription || prev.metaDescription,
        };
      });
    } catch (err) { setSaveMsg("Error IA: " + String(err)); }
    finally { setContentAILoading(false); }
  }

  // ── AI Recommendations ────────────────────────────────────────────────────
  async function getRecommendations() {
    if (!editing) return;
    setRecLoading(true); setRecFixes([]); setRecSummary(""); setRecContentFull(null);
    try {
      const res = await fetch("/api/seo/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item: editing, clientName: activeClient?.name }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRecSummary(data.summary || "");
      setRecFixes((data.fixes || []).map((f: AiFix) => ({ ...f, applied: false })));
      setRecContentFull(data.contentFull && data.contentFull !== "null" ? data.contentFull : null);
    } catch (err) { setSaveMsg("Error IA: " + String(err)); }
    finally { setRecLoading(false); }
  }

  function applyFix(fix: AiFix) {
    if (!editing) return;
    const field = fix.field as keyof WpItem;
    const value = fix.field === "content" && recContentFull ? recContentFull : fix.value;
    setEditing((prev) => prev ? { ...prev, [field]: cleanContent(value) } : prev);
    setRecFixes((prev) => prev.map((f) => f.check === fix.check ? { ...f, applied: true } : f));
  }

  async function applyAllFixes() {
    if (!editing) return;
    setApplyingAll(true);
    const updates: Partial<WpItem> = {};
    for (const fix of recFixes) {
      const field = fix.field as keyof WpItem;
      const value = fix.field === "content" && recContentFull ? recContentFull : fix.value;
      (updates as Record<string, string>)[field as string] = fix.field === "content" ? cleanContent(value) : value;
    }
    setEditing((prev) => prev ? { ...prev, ...updates } : prev);
    setRecFixes((prev) => prev.map((f) => ({ ...f, applied: true })));
    setApplyingAll(false);
  }

  // ── Bulk AI ───────────────────────────────────────────────────────────────
  async function runAI() {
    if (!aiInstructions.trim()) return;
    setAiLoading(true); setAiResults([]); setApplyMsg("");
    try {
      const selectedItems = items.filter((i) => selected.has(i.id))
        .map((i) => ({ id: i.id, title: i.title, type: i.type, link: i.link }));
      const res = await fetch("/api/seo/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: selectedItems, instructions: aiInstructions, clientName: activeClient?.name }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAiResults(data.results.map((r: AiResult) => ({ ...r, schema: r.schema || "" })));
    } catch (err) { setApplyMsg("Error IA: " + String(err)); }
    finally { setAiLoading(false); }
  }

  async function applyAIResults() {
    setApplying(true); setApplyMsg(""); let ok = 0;
    for (const result of aiResults) {
      try {
        const item = items.find((i) => i.id === result.id);
        if (!item) continue;
        const wpType = item.type === "product" ? "product" : "pages";
        await wpFetch(`${wpType}/${result.id}`, "wp/v2", "POST", {
          meta: { rank_math_title: result.seoTitle, rank_math_description: result.metaDescription, rank_math_focus_keyword: result.focusKeyword, rank_math_rich_snippet: result.schema },
        });
        const updater = (prev: WpItem[]) => prev.map((it) => it.id === result.id ? { ...it, ...result } : it);
        if (item.type === "page") setPages(updater); else setProducts(updater);
        setAiResults((prev) => prev.map((r) => r.id === result.id ? { ...r, applied: true } : r));
        ok++;
      } catch { /* continue */ }
    }
    setApplyMsg(`✓ ${ok} / ${aiResults.length} actualizados en WordPress`);
    setApplying(false);
  }

  // ── Mass product positioning ───────────────────────────────────────────────
  async function massPositionProducts() {
    if (!activeClient?.wpUrl || !activeClient?.wpUsername || !activeClient?.wpAppPassword) return;
    const selectedProducts = products.filter((p) => selected.has(p.id));
    if (!selectedProducts.length) return;

    setMassRunning(true);
    setMassDone(false);
    setMassProgress(selectedProducts.map((p) => ({ id: p.id, name: p.title, status: "pending" })));

    // Mark each as processing one by one via streaming state updates
    const productsInput = selectedProducts.map((p) => ({ id: p.id, name: p.title }));

    // Start processing via API
    try {
      // Process with server-side streaming updates by calling individually
      for (let i = 0; i < productsInput.length; i++) {
        const product = productsInput[i];
        setMassProgress((prev) => prev.map((p) => p.id === product.id ? { ...p, status: "processing" } : p));

        try {
          const res = await fetch("/api/seo/mass-products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              products: [product],
              wpUrl: activeClient.wpUrl,
              wpUsername: activeClient.wpUsername,
              wpAppPassword: activeClient.wpAppPassword,
              clientName: activeClient.name,
            }),
          });
          const data = await res.json();
          const result = data.results?.[0];
          if (result?.success) {
            setMassProgress((prev) => prev.map((p) =>
              p.id === product.id ? { ...p, status: "done", metaTitle: result.metaTitle, metaDescription: result.metaDescription, focusKeyword: result.focusKeyword } : p
            ));
            // Update product in local state
            setProducts((prev) => prev.map((pr) => pr.id === product.id ? {
              ...pr,
              seoTitle: result.metaTitle || pr.seoTitle,
              metaDescription: result.metaDescription || pr.metaDescription,
              focusKeyword: result.focusKeyword || pr.focusKeyword,
              schema: "Product",
            } : pr));
          } else {
            setMassProgress((prev) => prev.map((p) =>
              p.id === product.id ? { ...p, status: "error", error: result?.error || "Error desconocido" } : p
            ));
          }
        } catch (err) {
          setMassProgress((prev) => prev.map((p) =>
            p.id === product.id ? { ...p, status: "error", error: String(err) } : p
          ));
        }
      }
    } finally {
      setMassRunning(false);
      setMassDone(true);
    }
  }

  // ── Mass category positioning ──────────────────────────────────────────────
  async function massPositionCategories() {
    if (!activeClient?.wpUrl || !activeClient?.wpUsername || !activeClient?.wpAppPassword) return;
    const selectedCats = categories.filter((c) => selected.has(c.id));
    if (!selectedCats.length) return;

    setMassCatRunning(true);
    setMassCatDone(false);
    setMassCatProgress(selectedCats.map((c) => ({ id: c.id, name: c.title, status: "pending" })));

    const catsInput = selectedCats.map((c) => ({ id: c.id, name: c.title }));

    try {
      for (let i = 0; i < catsInput.length; i++) {
        const cat = catsInput[i];
        setMassCatProgress((prev) => prev.map((c) => c.id === cat.id ? { ...c, status: "processing" } : c));
        try {
          const res = await fetch("/api/seo/mass-categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              categories: [cat],
              wpUrl: activeClient.wpUrl,
              wpUsername: activeClient.wpUsername,
              wpAppPassword: activeClient.wpAppPassword,
              clientName: activeClient.name,
            }),
          });
          const data = await res.json();
          const result = data.results?.[0];
          if (result?.success) {
            setMassCatProgress((prev) => prev.map((c) =>
              c.id === cat.id ? { ...c, status: "done", metaTitle: result.metaTitle, metaDescription: result.metaDescription, focusKeyword: result.focusKeyword } : c
            ));
          } else {
            setMassCatProgress((prev) => prev.map((c) =>
              c.id === cat.id ? { ...c, status: "error", error: result?.error || "Error desconocido" } : c
            ));
          }
        } catch (err) {
          setMassCatProgress((prev) => prev.map((c) =>
            c.id === cat.id ? { ...c, status: "error", error: String(err) } : c
          ));
        }
      }
    } finally {
      setMassCatRunning(false);
      setMassCatDone(true);
    }
  }

  // ── Selection ─────────────────────────────────────────────────────────────
  function toggleSelect(id: number) {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAll() {
    setSelected(selected.size === items.length ? new Set() : new Set(items.map((i) => i.id)));
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      <Header title="Conector WordPress SEO" subtitle="Rank Math — posicionamiento de páginas y productos" />

      <div className="p-6 space-y-5">

        {/* Client bar */}
        {!activeClient ? (
          <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <AlertCircle size={20} className="text-yellow-600 shrink-0" />
            <p className="text-sm text-yellow-700">Selecciona un cliente activo desde <strong>Gestión de Clientes</strong>.</p>
          </div>
        ) : !activeClient.wpUrl ? (
          <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
            <AlertCircle size={20} className="text-orange-600 shrink-0" />
            <p className="text-sm text-orange-700">El cliente <strong>{activeClient.name}</strong> no tiene WordPress configurado.</p>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
            <div className="flex items-center gap-3">
              {connected ? <CheckCircle2 size={20} className="text-green-500" /> : <Globe size={20} className="text-gray-400" />}
              <div>
                <p className="font-semibold text-gray-900 text-sm">{activeClient.name}</p>
                <p className="text-xs text-gray-400">{activeClient.wpUrl}</p>
              </div>
            </div>
            <button onClick={connect} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-black"
              style={{ backgroundColor: "#FFC207" }}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              {connected ? "Sincronizar" : "Conectar"}
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <XCircle size={20} className="text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* ── Configuración requerida para productos ── */}
        {connected && (
          <div className="bg-white rounded-xl border border-blue-200 overflow-hidden">
            <button
              onClick={() => setShowSetup((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-blue-50 transition"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50">
                  <Info size={16} className="text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 text-sm">Configuración requerida para guardar en productos WooCommerce</p>
                  <p className="text-xs text-gray-400">Activa el snippet en WordPress para que Rank Math acepte cambios vía REST API</p>
                </div>
              </div>
              {showSetup ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>

            {showSetup && (
              <div className="border-t border-blue-100 p-5 space-y-4">
                {/* Pasos */}
                <div className="space-y-3">
                  {[
                    { n: 1, text: "En WordPress ve a", bold: "Code Snippets → Añadir nuevo" },
                    { n: 2, text: "Pon como título:", bold: "Rank Math REST API productos" },
                    { n: 3, text: "Copia el código de abajo y pégalo en el editor del snippet", bold: "" },
                    { n: 4, text: "En \"Ejecutar en\" selecciona:", bold: "Run everywhere (en todas partes)" },
                    { n: 5, text: "Haz clic en", bold: "Guardar y Activar" },
                  ].map(({ n, text, bold }) => (
                    <div key={n} className="flex items-start gap-3">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">{n}</span>
                      <p className="text-sm text-gray-700">
                        {text} {bold && <strong>{bold}</strong>}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Code block */}
                <div className="relative">
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-800 rounded-t-lg">
                    <span className="text-xs text-gray-400 font-mono">PHP — Code Snippets</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
`add_action( 'init', function () {
    $fields = [
        'rank_math_title'         => 'string',
        'rank_math_description'   => 'string',
        'rank_math_focus_keyword' => 'string',
        'rank_math_rich_snippet'  => 'string',
    ];

    foreach ( $fields as $key => $type ) {
        register_post_meta( 'product', $key, [
            'show_in_rest'  => true,
            'single'        => true,
            'type'          => $type,
            'auth_callback' => '__return_true',
        ] );
    }
} );`
                        );
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white transition"
                    >
                      {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                      {copied ? "¡Copiado!" : "Copiar"}
                    </button>
                  </div>
                  <pre className="bg-gray-900 text-green-300 text-xs p-4 rounded-b-lg overflow-x-auto leading-relaxed font-mono whitespace-pre">{`add_action( 'init', function () {
    $fields = [
        'rank_math_title'         => 'string',
        'rank_math_description'   => 'string',
        'rank_math_focus_keyword' => 'string',
        'rank_math_rich_snippet'  => 'string',
    ];

    foreach ( $fields as $key => $type ) {
        register_post_meta( 'product', $key, [
            'show_in_rest'  => true,
            'single'        => true,
            'type'          => $type,
            'auth_callback' => '__return_true',
        ] );
    }
} );`}</pre>
                </div>

                <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 size={15} className="text-green-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-green-700">
                    Una vez activado el snippet, podrás guardar el título SEO, meta descripción, keyword y schema directamente desde esta app en todos los productos WooCommerce.
                    <strong> Solo se necesita activar una vez.</strong>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {connected && (
          <>
            {/* Tabs */}
            <div className="flex gap-2 flex-wrap">
              {([
                { key: "pages", label: `Páginas (${pages.length})`, icon: <FileText size={14} /> },
                { key: "products", label: `Productos (${products.length})`, icon: <ShoppingBag size={14} /> },
                { key: "categories", label: `Categorías (${categories.length})`, icon: <Tag size={14} /> },
              ] as const).map(({ key, label, icon }) => (
                <button key={key} onClick={() => { setTab(key); setSelected(new Set()); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === key ? "text-black" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                  style={tab === key ? { backgroundColor: "#FFC207" } : {}}>
                  {icon}{label}
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-3 py-3 w-8">
                      <input type="checkbox" checked={items.length > 0 && selected.size === items.length} onChange={toggleAll} className="rounded accent-yellow-400" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Título</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Keyword</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Schema</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Score</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const score = calcScore(item);
                    return (
                      <tr key={item.id} className={`border-b border-gray-50 hover:bg-gray-50 transition ${selected.has(item.id) ? "bg-yellow-50/40" : ""}`}>
                        <td className="px-3 py-3">
                          <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleSelect(item.id)} className="rounded accent-yellow-400" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {item.type === "product" ? <ShoppingBag size={13} className="text-gray-400 shrink-0" /> : <FileText size={13} className="text-gray-400 shrink-0" />}
                            <span className="font-medium text-gray-900 text-xs">{item.title}</span>
                          </div>
                          {item.seoTitle && <p className="text-xs text-gray-400 ml-5 truncate max-w-xs">{item.seoTitle}</p>}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {item.focusKeyword
                            ? <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">{item.focusKeyword.split(",")[0]}</span>
                            : <span className="text-gray-300">Sin definir</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{item.schema || <span className="text-gray-300">—</span>}</td>
                        <td className="px-4 py-3 text-center">
                          <ScoreBadge score={score} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <a href={item.link} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200">
                              <ExternalLink size={13} className="text-gray-500" />
                            </a>
                            <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-yellow-100" style={{ backgroundColor: "#FFC20720" }}>
                              <Pencil size={13} style={{ color: "#b8860b" }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {items.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No se encontraron {tab === "pages" ? "páginas" : tab === "products" ? "productos" : "categorías"}</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mass Product Positioning Button */}
            {tab === "products" && selected.size > 0 && (
              <div className="bg-white rounded-xl border border-yellow-300 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-100">
                    <ShoppingBag size={16} style={{ color: "#b8860b" }} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Posicionamiento Masivo de Productos</p>
                    <p className="text-xs text-gray-500">Genera SEO completo + RankMath para {selected.size} producto{selected.size !== 1 ? "s" : ""} usando su nombre como keyword</p>
                  </div>
                </div>
                <button onClick={() => { setMassModalOpen(true); setMassProgress([]); setMassDone(false); }}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-black shrink-0"
                  style={{ backgroundColor: "#FFC207" }}>
                  <Sparkles size={14} />
                  Posicionar masivamente ({selected.size})
                </button>
              </div>
            )}

            {/* Mass Category Positioning Button */}
            {tab === "categories" && selected.size > 0 && (
              <div className="bg-white rounded-xl border border-yellow-300 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-100">
                    <Tag size={16} style={{ color: "#b8860b" }} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Posicionamiento Masivo de Categorías</p>
                    <p className="text-xs text-gray-500">Genera SEO completo + RankMath para {selected.size} categoría{selected.size !== 1 ? "s" : ""} usando su nombre como keyword</p>
                  </div>
                </div>
                <button onClick={() => { setMassCatModalOpen(true); setMassCatProgress([]); setMassCatDone(false); }}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-black shrink-0"
                  style={{ backgroundColor: "#FFC207" }}>
                  <Sparkles size={14} />
                  Posicionar masivamente ({selected.size})
                </button>
              </div>
            )}

            {/* Bulk AI Panel */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button onClick={() => setShowAI((v) => !v)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: "#FFC20720" }}>
                    <Sparkles size={16} style={{ color: "#b8860b" }} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 text-sm">Optimización IA masiva — Rank Math</p>
                    <p className="text-xs text-gray-400">
                      {selected.size > 0 ? `${selected.size} elemento${selected.size > 1 ? "s" : ""} seleccionado${selected.size > 1 ? "s" : ""}` : "Selecciona páginas/productos para optimizar en bloque"}
                    </p>
                  </div>
                </div>
                {showAI ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </button>

              {showAI && (
                <div className="border-t border-gray-100 p-5 space-y-4">
                  <textarea value={aiInstructions} onChange={(e) => setAiInstructions(e.target.value)} rows={3}
                    placeholder="Ej: Posiciona estos productos para búsquedas de arriendo de equipos industriales en Chile. Público: empresas de logística. Enfócate en conversión."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none" />
                  <div className="flex items-center gap-3">
                    <button onClick={runAI} disabled={aiLoading || selected.size === 0 || !aiInstructions.trim()}
                      className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-black disabled:opacity-50"
                      style={{ backgroundColor: "#FFC207" }}>
                      {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      {aiLoading ? "Generando..." : `Optimizar ${selected.size} elemento${selected.size !== 1 ? "s" : ""}`}
                    </button>
                    {selected.size === 0 && <p className="text-xs text-gray-400">Selecciona elementos primero</p>}
                  </div>

                  {aiResults.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-700">Resultados — edita si necesitas ajustar</p>
                        <button onClick={applyAIResults} disabled={applying}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-green-500 text-white hover:bg-green-600 disabled:opacity-60">
                          {applying ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                          {applying ? "Aplicando..." : "Aplicar todo en WordPress"}
                        </button>
                      </div>
                      {aiResults.map((result) => {
                        const item = items.find((i) => i.id === result.id);
                        return (
                          <div key={result.id} className={`p-4 rounded-lg border ${result.applied ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"}`}>
                            <div className="flex items-center gap-2 mb-3">
                              {result.applied && <Check size={14} className="text-green-600" />}
                              <p className="font-medium text-sm text-gray-800">{item?.title}</p>
                              <ScoreBadge score={calcScore({ ...result, content: item?.content || "", link: item?.link || "" })} />
                            </div>
                            <div className="grid gap-2">
                              <div>
                                <label className="text-xs text-gray-500 block mb-0.5">SEO Title ({result.seoTitle.length}/60)</label>
                                <input value={result.seoTitle} maxLength={60}
                                  onChange={(e) => setAiResults((p) => p.map((r) => r.id === result.id ? { ...r, seoTitle: e.target.value } : r))}
                                  className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-yellow-400" />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 block mb-0.5">Meta Descripción ({result.metaDescription.length}/160)</label>
                                <textarea value={result.metaDescription} maxLength={160} rows={2}
                                  onChange={(e) => setAiResults((p) => p.map((r) => r.id === result.id ? { ...r, metaDescription: e.target.value } : r))}
                                  className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-yellow-400 resize-none" />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-xs text-gray-500 block mb-0.5">Focus Keyword</label>
                                  <input value={result.focusKeyword}
                                    onChange={(e) => setAiResults((p) => p.map((r) => r.id === result.id ? { ...r, focusKeyword: e.target.value } : r))}
                                    className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-yellow-400" />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500 block mb-0.5">Schema</label>
                                  <select value={result.schema}
                                    onChange={(e) => setAiResults((p) => p.map((r) => r.id === result.id ? { ...r, schema: e.target.value } : r))}
                                    className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none">
                                    <option value="">Sin schema</option>
                                    {SCHEMA_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {applyMsg && <p className={`text-sm font-medium ${applyMsg.includes("Error") ? "text-red-600" : "text-green-600"}`}>{applyMsg}</p>}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Mass Product Positioning Modal ── */}
      {massModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <p className="font-bold text-gray-900">Posicionamiento Masivo de Productos</p>
                <p className="text-xs text-gray-400 mt-0.5">El nombre del producto se usa como palabra clave principal</p>
              </div>
              {!massRunning && (
                <button onClick={() => setMassModalOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                  <X size={16} className="text-gray-500" />
                </button>
              )}
            </div>

            {/* Product list / progress */}
            <div className="flex-1 overflow-y-auto p-6 space-y-2">
              {massProgress.length === 0 ? (
                // Pre-launch: show product list
                products.filter((p) => selected.has(p.id)).map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
                    <ShoppingBag size={14} className="text-gray-400 shrink-0" />
                    <p className="text-sm text-gray-800 flex-1 truncate">{p.title}</p>
                    <span className="text-xs text-gray-400">pendiente</span>
                  </div>
                ))
              ) : (
                // Running: show status per product
                massProgress.map((p) => (
                  <div key={p.id} className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border ${
                    p.status === "done" ? "bg-green-50 border-green-200" :
                    p.status === "error" ? "bg-red-50 border-red-200" :
                    p.status === "processing" ? "bg-yellow-50 border-yellow-200" :
                    "bg-gray-50 border-gray-200"
                  }`}>
                    <div className="mt-0.5 shrink-0">
                      {p.status === "done" && <Check size={14} className="text-green-600" />}
                      {p.status === "error" && <XCircle size={14} className="text-red-500" />}
                      {p.status === "processing" && <Loader2 size={14} className="animate-spin text-yellow-600" />}
                      {p.status === "pending" && <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                      {p.status === "done" && p.focusKeyword && (
                        <p className="text-xs text-green-600 mt-0.5">Keyword: {p.focusKeyword}</p>
                      )}
                      {p.status === "error" && p.error && (
                        <p className="text-xs text-red-500 mt-0.5 truncate">{p.error}</p>
                      )}
                      {p.status === "processing" && (
                        <p className="text-xs text-yellow-600 mt-0.5">Generando SEO y actualizando WordPress...</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
              {massDone && (
                <p className="text-sm text-green-600 font-medium">
                  ✓ {massProgress.filter((p) => p.status === "done").length}/{massProgress.length} productos posicionados
                </p>
              )}
              {!massDone && <div />}
              <div className="flex gap-2 ml-auto">
                {!massRunning && !massDone && (
                  <button onClick={() => setMassModalOpen(false)} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
                    Cancelar
                  </button>
                )}
                {!massRunning && !massDone && (
                  <button onClick={massPositionProducts}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-black"
                    style={{ backgroundColor: "#FFC207" }}>
                    <Sparkles size={14} />
                    Iniciar posicionamiento
                  </button>
                )}
                {massDone && (
                  <button onClick={() => { setMassModalOpen(false); setSelected(new Set()); }}
                    className="px-5 py-2 rounded-lg text-sm font-semibold text-black"
                    style={{ backgroundColor: "#FFC207" }}>
                    Cerrar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Mass Category Positioning Modal ── */}
      {massCatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <p className="font-bold text-gray-900">Posicionamiento Masivo de Categorías</p>
                <p className="text-xs text-gray-400 mt-0.5">El nombre de la categoría se usa como palabra clave principal</p>
              </div>
              {!massCatRunning && (
                <button onClick={() => setMassCatModalOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                  <X size={16} className="text-gray-500" />
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-2">
              {massCatProgress.length === 0 ? (
                categories.filter((c) => selected.has(c.id)).map((c) => (
                  <div key={c.id} className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
                    <Tag size={14} className="text-gray-400 shrink-0" />
                    <p className="text-sm text-gray-800 flex-1 truncate">{c.title}</p>
                    <span className="text-xs text-gray-400">pendiente</span>
                  </div>
                ))
              ) : (
                massCatProgress.map((c) => (
                  <div key={c.id} className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border ${
                    c.status === "done" ? "bg-green-50 border-green-200" :
                    c.status === "error" ? "bg-red-50 border-red-200" :
                    c.status === "processing" ? "bg-yellow-50 border-yellow-200" :
                    "bg-gray-50 border-gray-200"
                  }`}>
                    <div className="mt-0.5 shrink-0">
                      {c.status === "done" && <Check size={14} className="text-green-600" />}
                      {c.status === "error" && <XCircle size={14} className="text-red-500" />}
                      {c.status === "processing" && <Loader2 size={14} className="animate-spin text-yellow-600" />}
                      {c.status === "pending" && <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
                      {c.status === "done" && c.focusKeyword && (
                        <p className="text-xs text-green-600 mt-0.5">Keyword: {c.focusKeyword}</p>
                      )}
                      {c.status === "error" && c.error && (
                        <p className="text-xs text-red-500 mt-0.5 truncate">{c.error}</p>
                      )}
                      {c.status === "processing" && (
                        <p className="text-xs text-yellow-600 mt-0.5">Generando SEO y actualizando WordPress...</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
              {massCatDone && (
                <p className="text-sm text-green-600 font-medium">
                  ✓ {massCatProgress.filter((c) => c.status === "done").length}/{massCatProgress.length} categorías posicionadas
                </p>
              )}
              {!massCatDone && <div />}
              <div className="flex gap-2 ml-auto">
                {!massCatRunning && !massCatDone && (
                  <button onClick={() => setMassCatModalOpen(false)} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">Cancelar</button>
                )}
                {!massCatRunning && !massCatDone && (
                  <button onClick={massPositionCategories}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-black"
                    style={{ backgroundColor: "#FFC207" }}>
                    <Sparkles size={14} />
                    Iniciar posicionamiento
                  </button>
                )}
                {massCatRunning && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 size={14} className="animate-spin" />
                    Procesando {massCatProgress.filter((c) => c.status === "done").length}/{massCatProgress.length}...
                  </div>
                )}
                {massCatDone && (
                  <button onClick={() => { setMassCatModalOpen(false); setSelected(new Set()); }}
                    className="px-5 py-2 rounded-lg text-sm font-semibold text-black"
                    style={{ backgroundColor: "#FFC207" }}>
                    Cerrar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Full-screen Edit Modal ── */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-gray-100 flex flex-col">

          {/* Top bar */}
          <div className="flex items-center gap-0 bg-white border-b border-gray-200 shrink-0">
            {/* Back + title */}
            <div className="flex items-center gap-3 px-4 py-2.5 border-r border-gray-200 min-w-0 flex-1">
              <button onClick={() => setEditing(null)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 shrink-0">
                <X size={16} />
              </button>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{editing.title}</p>
                <a href={editing.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline truncate block">{editing.link}</a>
              </div>
              {editLoading && <Loader2 size={14} className="animate-spin text-gray-400 shrink-0" />}
            </div>

            {/* Tabs centered */}
            <div className="flex border-r border-gray-200">
              {([["content", "✏️ Contenido"], ["rankmath", "📊 Rank Math"], ["preview", "👁 Vista previa"]] as const).map(([t, label]) => (
                <button key={t} onClick={() => setRightTab(t as "rankmath" | "content" | "preview")}
                  className={`px-5 py-3 text-sm font-semibold transition-colors whitespace-nowrap ${rightTab === t ? "border-b-2 border-yellow-400 text-yellow-700 bg-yellow-50" : "text-gray-500 hover:bg-gray-50"}`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 px-4 py-2.5 ml-auto">
              {saveMsg && <p className={`text-sm font-medium ${saveMsg.includes("Error") ? "text-red-600" : "text-green-600"}`}>{saveMsg}</p>}
              <ScoreBadge score={calcScore(editing)} />
              <button onClick={saveMetadata} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-black disabled:opacity-60"
                style={{ backgroundColor: "#FFC207" }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Guardar en WordPress
              </button>
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 min-h-0 overflow-hidden">

            {/* ── TAB: Contenido ── */}
            {rightTab === "content" && (
              <div className="h-full flex flex-col bg-gray-100 overflow-y-auto">
                {editing.content && (editing.content.includes("elementor") || editing.content.includes("[et_pb")) && (
                  <div className="mx-auto mt-4 max-w-3xl w-full px-4">
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-700">
                      ⚠️ Esta página usa <strong>Elementor</strong> — el contenido se muestra como HTML/shortcodes. Puedes editar el texto visible, pero los cambios de estructura pueden afectar el diseño visual.
                    </div>
                  </div>
                )}
                {/* Gutenberg-style editor */}
                <div className="mx-auto max-w-3xl w-full px-4 py-8 flex-1">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Document toolbar */}
                    <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-gray-50">
                      <span className="text-xs text-gray-400 font-medium">HTML / Gutenberg</span>
                      <div className="ml-auto flex gap-2">
                        <button
                          onClick={generateContent}
                          disabled={contentAILoading || !contentAIInst.trim()}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold text-black disabled:opacity-50"
                          style={{ backgroundColor: "#FFC207" }}>
                          {contentAILoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                          Generar IA
                        </button>
                      </div>
                    </div>
                    {/* Editor */}
                    <div className="p-8">
                      <textarea
                        value={editing.content}
                        onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                        className="w-full text-base leading-relaxed text-gray-900 focus:outline-none resize-none font-sans"
                        style={{ minHeight: "60vh", border: "none", fontFamily: "Georgia, 'Times New Roman', serif" }}
                        placeholder="Escribe o pega el contenido HTML de la página aquí..."
                        spellCheck
                      />
                    </div>
                  </div>
                  {/* AI instructions for content */}
                  <div className="mt-4 bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Sparkles size={14} style={{ color: "#b8860b" }} /> Generar contenido con IA</p>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">
                      Escribe la <strong>keyword principal</strong> que quieres posicionar + contexto del negocio.<br/>
                      Formato sugerido: <span className="font-mono bg-gray-100 px-1 rounded">[keyword] — [negocio/ciudad] — [público objetivo]</span>
                    </p>
                    <textarea value={contentAIInst} onChange={(e) => setContentAIInst(e.target.value)} rows={3}
                      placeholder={"Ej: arriendo transpaleta eléctrica Santiago — empresa de logística industrial — público: jefes de bodega y gerentes de operaciones\n\nEj: cortinas blackout a medida Chile — tienda online decoración — público: dueños de casa"}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none mb-2" />
                    <button onClick={generateContent} disabled={contentAILoading || !contentAIInst.trim()}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-black disabled:opacity-50"
                      style={{ backgroundColor: "#FFC207" }}>
                      {contentAILoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      {contentAILoading ? "Generando..." : "Generar y rellenar contenido + SEO"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB: Rank Math ── */}
            {rightTab === "rankmath" && (
              <div className="h-full overflow-y-auto">
                <div className="max-w-2xl mx-auto py-8 px-6 space-y-5">
                  {/* Score + checklist */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <ScoreBadge score={calcScore(editing)} />
                      <p className="text-sm font-semibold text-gray-700">SEO Score estimado</p>
                    </div>
                    <SeoChecklist item={editing} />
                  </div>

                  {/* Google preview */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Vista previa en Google</p>
                    <p className="text-base font-medium text-blue-700 truncate">{editing.seoTitle || editing.title}</p>
                    <p className="text-sm text-green-700 truncate">{editing.link}</p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{editing.metaDescription || "Sin descripción"}</p>
                  </div>

                  {/* Fields */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm font-semibold text-gray-700">SEO Title</label>
                        <span className={`text-xs ${editing.seoTitle.length > 55 ? "text-orange-500 font-medium" : "text-gray-400"}`}>{editing.seoTitle.length}/60</span>
                      </div>
                      <input value={editing.seoTitle} maxLength={60}
                        onChange={(e) => setEditing({ ...editing, seoTitle: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        placeholder="Título optimizado para Google (máx 60 chars)" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm font-semibold text-gray-700">Meta Descripción</label>
                        <span className={`text-xs ${editing.metaDescription.length > 150 ? "text-orange-500 font-medium" : "text-gray-400"}`}>{editing.metaDescription.length}/160</span>
                      </div>
                      <textarea value={editing.metaDescription} maxLength={160} rows={3}
                        onChange={(e) => setEditing({ ...editing, metaDescription: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                        placeholder="Descripción para Google (máx 160 chars)" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-1">Palabras Clave (sep. por comas)</label>
                      <input value={editing.focusKeyword}
                        onChange={(e) => setEditing({ ...editing, focusKeyword: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        placeholder="ej: arriendo apilador, transpaleta eléctrica Chile" />
                      <div className="flex flex-wrap gap-1 mt-2">
                        {editing.focusKeyword.split(",").filter(Boolean).map((kw, i) => (
                          <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">{kw.trim()}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-1">Schema Type</label>
                      <select value={editing.schema} onChange={(e) => setEditing({ ...editing, schema: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400">
                        <option value="">Sin schema</option>
                        {SCHEMA_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* ── AI Recommendations ── */}
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: "#FFC20720" }}>
                          <Sparkles size={16} style={{ color: "#b8860b" }} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">Recomendaciones experto SEO</p>
                          <p className="text-xs text-gray-400">La IA analiza qué falla y lo corrige automáticamente</p>
                        </div>
                      </div>
                      <button
                        onClick={getRecommendations}
                        disabled={recLoading}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-black disabled:opacity-50 shrink-0"
                        style={{ backgroundColor: "#FFC207" }}>
                        {recLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        {recLoading ? "Analizando..." : recFixes.length > 0 ? "Re-analizar" : "Analizar y corregir"}
                      </button>
                    </div>

                    {/* Loading */}
                    {recLoading && (
                      <div className="px-5 py-8 text-center">
                        <Loader2 size={24} className="animate-spin text-yellow-500 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">Analizando todos los criterios Rank Math...</p>
                        <p className="text-xs text-gray-400 mt-1">Esto puede tomar unos segundos</p>
                      </div>
                    )}

                    {/* Results */}
                    {!recLoading && recFixes.length > 0 && (
                      <div className="p-5 space-y-4">
                        {/* Summary */}
                        {recSummary && (
                          <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                            <Info size={15} className="text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-700">{recSummary}</p>
                          </div>
                        )}

                        {/* Apply all */}
                        <button
                          onClick={applyAllFixes}
                          disabled={applyingAll || recFixes.every((f) => f.applied)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-black disabled:opacity-50"
                          style={{ backgroundColor: recFixes.every((f) => f.applied) ? "#d1fae5" : "#FFC207" }}>
                          {applyingAll ? <Loader2 size={14} className="animate-spin" /> : recFixes.every((f) => f.applied) ? <Check size={14} className="text-green-600" /> : <Sparkles size={14} />}
                          {recFixes.every((f) => f.applied) ? "✓ Todas las correcciones aplicadas" : `Aplicar todas las correcciones (${recFixes.filter((f) => !f.applied).length})`}
                        </button>

                        {/* Fix cards */}
                        <div className="space-y-3">
                          {recFixes.map((fix, i) => {
                            const fieldColors: Record<string, string> = {
                              seoTitle: "bg-purple-50 text-purple-700",
                              metaDescription: "bg-blue-50 text-blue-700",
                              focusKeyword: "bg-green-50 text-green-700",
                              schema: "bg-orange-50 text-orange-700",
                              content: "bg-red-50 text-red-700",
                            };
                            const fieldLabels: Record<string, string> = {
                              seoTitle: "Título SEO",
                              metaDescription: "Meta Descripción",
                              focusKeyword: "Keyword",
                              schema: "Schema",
                              content: "Contenido",
                            };
                            return (
                              <div key={i} className={`rounded-xl border p-4 transition-all ${fix.applied ? "border-green-200 bg-green-50/50" : "border-gray-200 bg-gray-50"}`}>
                                <div className="flex items-start justify-between gap-3 mb-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${fieldColors[fix.field] || "bg-gray-100 text-gray-600"}`}>
                                      {fieldLabels[fix.field] || fix.field}
                                    </span>
                                    <span className="text-xs font-medium text-gray-700">{fix.check}</span>
                                  </div>
                                  {fix.applied
                                    ? <span className="shrink-0 flex items-center gap-1 text-xs text-green-600 font-semibold"><CheckCircle2 size={14} /> Aplicado</span>
                                    : <button onClick={() => applyFix(fix)}
                                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-black"
                                        style={{ backgroundColor: "#FFC207" }}>
                                        <Check size={12} /> Aplicar
                                      </button>
                                  }
                                </div>
                                <p className="text-xs text-red-600 mb-1.5">⚠️ {fix.issue}</p>
                                <p className="text-xs text-gray-600 mb-2">💡 {fix.advice}</p>
                                {/* Preview of fix value */}
                                {fix.field !== "content" && (
                                  <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 font-mono break-all">
                                    {fix.value}
                                  </div>
                                )}
                                {fix.field === "content" && (
                                  <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-500 italic">
                                    {recContentFull ? "Contenido completo (+600 palabras) listo para aplicar" : fix.value.substring(0, 120) + "..."}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Save reminder */}
                        {recFixes.some((f) => f.applied) && (
                          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
                            <AlertCircle size={14} className="shrink-0" />
                            Recuerda hacer clic en <strong>Guardar en WordPress</strong> para publicar los cambios.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Empty state */}
                    {!recLoading && recFixes.length === 0 && (
                      <div className="px-5 py-6 text-center text-gray-400 text-xs">
                        Haz clic en "Analizar y corregir" para que la IA revise todos los criterios Rank Math y genere las correcciones exactas.
                      </div>
                    )}
                  </div>

                  {/* ── Generar SEO con instrucciones ── */}
                  <div className="bg-white rounded-xl border border-dashed border-yellow-300 p-5">
                    <p className="text-sm font-semibold mb-1 flex items-center gap-2" style={{ color: "#b8860b" }}>
                      <Sparkles size={14} /> Generar SEO con instrucciones personalizadas
                    </p>
                    <p className="text-xs text-gray-400 mb-3">
                      Describe la keyword, el público y el tono — la IA rellena título, descripción y keyword.
                    </p>
                    <textarea
                      value={singleAIInst}
                      onChange={(e) => setSingleAIInst(e.target.value)}
                      rows={2}
                      placeholder="Ej: keyword 'ruedas transpaleta Chile', público industrial, tono profesional y confiable"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none mb-3"
                    />
                    <button
                      onClick={runSingleAI}
                      disabled={singleAILoading || !singleAIInst.trim()}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-black disabled:opacity-50 w-full justify-center"
                      style={{ backgroundColor: "#FFC207" }}>
                      {singleAILoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      {singleAILoading ? "Generando..." : "Generar y rellenar campos SEO"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB: Vista previa ── */}
            {rightTab === "preview" && (
              <div className="h-full relative">
                <iframe src={editing.link} className="w-full h-full border-0" title="Vista previa"
                  sandbox="allow-scripts allow-same-origin allow-forms" />
                <div className="absolute top-3 right-3">
                  <a href={editing.link} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-black/70 text-white text-xs rounded-lg hover:bg-black/90">
                    <ExternalLink size={12} /> Abrir en nueva pestaña
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
