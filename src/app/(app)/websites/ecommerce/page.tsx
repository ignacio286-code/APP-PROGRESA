"use client";

import { useState, useRef } from "react";
import Header from "@/components/Header";
import { useClient } from "@/lib/client-context";
import {
  Upload, Loader2, AlertCircle, CheckCircle2, ChevronRight,
  ShoppingBag, FileSpreadsheet, Package, Send, Download, RefreshCw,
} from "lucide-react";

interface Product {
  name: string;
  description: string;
  price: number;
  category: string;
  sku: string;
  stock: number;
  imageUrl?: string;
  seoDescription?: string;
}

interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: string[];
  wpIds: number[];
}

export default function EcommerceSitePage() {
  const { activeClient } = useClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [importing, setImporting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"import" | "generate">("import");

  // For AI store structure generation
  const [storeDesc, setStoreDesc] = useState("");
  const [storeType, setStoreType] = useState("tienda general");
  const [generatedStructure, setGeneratedStructure] = useState<Record<string, unknown> | null>(null);

  const hasWp = !!(activeClient?.wpUrl && activeClient?.wpUsername && activeClient?.wpAppPassword);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".csv")) {
      setError("Por favor sube un archivo .xlsx o .csv");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("clientId", activeClient?.id || "");

    setImporting(true);
    setError(null);
    try {
      const res = await fetch("/api/websites/import-products", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setProducts(data.products || []);
    } catch (err) {
      setError(String(err));
    } finally {
      setImporting(false);
    }
  }

  async function publishProducts() {
    if (!products.length || !activeClient?.wpUrl) return;
    setImporting(true);
    setImportResult(null);
    const results: ImportResult = { total: products.length, success: 0, failed: 0, errors: [], wpIds: [] };

    for (const product of products) {
      try {
        const res = await fetch("/api/wordpress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wpUrl: activeClient.wpUrl,
            wpUsername: activeClient.wpUsername,
            wpAppPassword: activeClient.wpAppPassword,
            endpoint: "products",
            method: "POST",
            body: {
              name: product.name,
              description: product.seoDescription || product.description,
              short_description: product.description,
              regular_price: String(product.price),
              sku: product.sku,
              stock_quantity: product.stock,
              manage_stock: true,
              status: "publish",
              categories: product.category ? [{ name: product.category }] : [],
            },
          }),
        });
        const data = await res.json();
        if (data.error) {
          results.failed++;
          results.errors.push(`${product.name}: ${data.error}`);
        } else {
          results.success++;
          results.wpIds.push(data.id);
        }
      } catch (err) {
        results.failed++;
        results.errors.push(`${product.name}: ${String(err)}`);
      }
    }

    setImportResult(results);
    setImporting(false);
  }

  async function generateSEODescriptions() {
    if (!products.length) return;
    setGenerating(true);
    try {
      const updatedProducts = await Promise.all(
        products.map(async (product) => {
          const res = await fetch("/api/seo/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "product",
              keyword: product.name,
              clientName: activeClient?.name,
              tone: "persuasivo",
            }),
          });
          const data = await res.json();
          return { ...product, seoDescription: data.longDescription || product.description };
        })
      );
      setProducts(updatedProducts);
    } finally {
      setGenerating(false);
    }
  }

  async function generateStoreStructure() {
    if (!storeDesc.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/websites/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ecommerce",
          clientName: activeClient?.name,
          businessDescription: storeDesc,
          storeType,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setGeneratedStructure(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div>
      <Header title="Tienda WooCommerce con IA" subtitle="Configura tu tienda e importa productos masivamente" />

      <div className="p-6 space-y-6">
        {!hasWp && activeClient && (
          <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-orange-500" />
              <p className="text-sm text-orange-700">Configura WordPress para publicar productos.</p>
            </div>
            <a href="/clients" className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg text-white bg-orange-500">
              Configurar <ChevronRight size={12} />
            </a>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { key: "import", label: "Importar productos (Excel)", icon: FileSpreadsheet },
            { key: "generate", label: "Generar estructura con IA", icon: ShoppingBag },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key as "import" | "generate")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === key ? "text-black" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
              style={tab === key ? { backgroundColor: "#FFC207" } : {}}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* Import tab */}
        {tab === "import" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {/* Upload area */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Archivo de productos</h3>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-yellow-400 transition-colors"
                >
                  <Upload size={32} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm font-medium text-gray-600">Sube tu archivo Excel o CSV</p>
                  <p className="text-xs text-gray-400 mt-1">Formatos: .xlsx, .csv</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Template download */}
                <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Columnas requeridas:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["nombre", "descripcion", "precio", "categoria", "sku", "stock", "imagen_url"].map((col) => (
                      <code key={col} className="text-xs bg-white border border-gray-200 px-1.5 py-0.5 rounded">{col}</code>
                    ))}
                  </div>
                  <button className="flex items-center gap-1 mt-3 text-xs text-blue-600 hover:underline">
                    <Download size={12} /> Descargar plantilla Excel
                  </button>
                </div>
              </div>

              {products.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">{products.length} productos cargados</p>
                    <button
                      onClick={() => setProducts([])}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Limpiar
                    </button>
                  </div>

                  <button
                    onClick={generateSEODescriptions}
                    disabled={generating}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {generating ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                    Generar descripciones SEO con IA
                  </button>

                  {hasWp && (
                    <button
                      onClick={publishProducts}
                      disabled={importing}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: "#FFC207" }}
                    >
                      {importing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      Publicar {products.length} productos en WooCommerce
                    </button>
                  )}
                </div>
              )}

              {/* Import result */}
              {importResult && (
                <div className={`p-4 rounded-xl border ${importResult.failed > 0 ? "bg-orange-50 border-orange-200" : "bg-green-50 border-green-200"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {importResult.failed === 0 ? (
                      <CheckCircle2 size={16} className="text-green-500" />
                    ) : (
                      <AlertCircle size={16} className="text-orange-500" />
                    )}
                    <p className="text-sm font-semibold">
                      {importResult.success}/{importResult.total} productos publicados
                    </p>
                  </div>
                  {importResult.errors.length > 0 && (
                    <ul className="text-xs text-red-600 space-y-0.5">
                      {importResult.errors.slice(0, 5).map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Products table */}
            <div className="lg:col-span-3">
              {importing && products.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 bg-white rounded-xl border border-gray-200">
                  <Loader2 size={28} className="animate-spin text-yellow-500 mb-2" />
                  <p className="text-sm text-gray-500">Procesando archivo...</p>
                </div>
              ) : products.length > 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700">Productos importados</h3>
                    <span className="text-xs text-gray-400">{products.filter((p) => p.seoDescription).length} con SEO</span>
                  </div>
                  <div className="max-h-[500px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Producto</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Precio</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">SKU</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Stock</th>
                          <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500">SEO</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product, i) => (
                          <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="px-4 py-2">
                              <p className="font-medium text-gray-900 text-xs">{product.name}</p>
                              <p className="text-xs text-gray-400">{product.category}</p>
                            </td>
                            <td className="px-4 py-2 text-xs font-semibold">${product.price}</td>
                            <td className="px-4 py-2 text-xs text-gray-400">{product.sku || "—"}</td>
                            <td className="px-4 py-2 text-xs">{product.stock}</td>
                            <td className="px-4 py-2 text-center">
                              {product.seoDescription ? (
                                <CheckCircle2 size={14} className="text-green-500 mx-auto" />
                              ) : (
                                <span className="text-gray-300 text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-dashed border-gray-200">
                  <Package size={32} className="text-gray-300 mb-3" />
                  <p className="text-gray-400 text-sm">Los productos del Excel aparecerán aquí</p>
                  <p className="text-xs text-gray-300 mt-1">Sube tu archivo para comenzar</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Generate tab */}
        {tab === "generate" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de tienda</label>
                  <select
                    value={storeType}
                    onChange={(e) => setStoreType(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  >
                    {["tienda general", "moda y ropa", "electrónica", "alimentos", "cosméticos", "deportes", "hogar y jardín"].map((t) => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción de la tienda *</label>
                  <textarea
                    value={storeDesc}
                    onChange={(e) => setStoreDesc(e.target.value)}
                    rows={5}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                    placeholder={`ej: Tienda de ${activeClient?.name || "productos"} especializada en... Vendemos... Nuestro diferencial...`}
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  onClick={generateStoreStructure}
                  disabled={generating || !storeDesc.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: "#FFC207" }}
                >
                  {generating ? <Loader2 size={16} className="animate-spin" /> : <ShoppingBag size={16} />}
                  Generar estructura de tienda
                </button>
              </div>
            </div>

            <div className="lg:col-span-3">
              {generating ? (
                <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-gray-200">
                  <Loader2 size={32} className="animate-spin text-yellow-500 mb-3" />
                  <p className="text-gray-500 text-sm">Diseñando tu tienda WooCommerce...</p>
                </div>
              ) : generatedStructure ? (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900 mb-4">Estructura generada</h3>
                  <pre className="text-xs bg-gray-50 p-4 rounded-xl overflow-auto max-h-96 text-gray-700">
                    {JSON.stringify(generatedStructure, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-dashed border-gray-200">
                  <ShoppingBag size={32} className="text-gray-300 mb-3" />
                  <p className="text-gray-400 text-sm">La estructura de tu tienda aparecerá aquí</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
