import { NextRequest, NextResponse } from "next/server";

// Parse CSV products
function parseCSV(text: string) {
  const lines = text.split("\n").filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/['"]/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] || ""; });
    return {
      name: row.nombre || row.name || row.producto || "",
      description: row.descripcion || row.description || "",
      price: parseFloat(row.precio || row.price || "0") || 0,
      category: row.categoria || row.category || "General",
      sku: row.sku || "",
      stock: parseInt(row.stock || "0") || 0,
      imageUrl: row.imagen_url || row.image_url || row.imagen || "",
    };
  }).filter((p) => p.name);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
    }

    const text = await file.text();
    let products: ReturnType<typeof parseCSV> = [];

    if (file.name.endsWith(".csv")) {
      products = parseCSV(text);
    } else if (file.name.endsWith(".xlsx")) {
      // For .xlsx, return instructions to use csv
      return NextResponse.json({
        error: "Para archivos Excel (.xlsx), por favor conviértelo a CSV primero o instala la librería 'xlsx' con: npm install xlsx",
      }, { status: 400 });
    }

    if (products.length === 0) {
      return NextResponse.json({ error: "No se encontraron productos válidos en el archivo. Verifica que las columnas sean: nombre, descripcion, precio, categoria, sku, stock" }, { status: 400 });
    }

    return NextResponse.json({ products, total: products.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
