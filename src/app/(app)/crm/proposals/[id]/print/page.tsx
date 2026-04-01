"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";

interface ProposalItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  order: number;
}

interface Proposal {
  id: string;
  folio?: string;
  name: string;
  clientRut?: string;
  clientAddress?: string;
  clientPhone?: string;
  clientEmail?: string;
  status: string;
  issueDate: string;
  dueDate?: string;
  agentName?: string;
  agentPhone?: string;
  agentEmail?: string;
  termsConditions?: string;
  notes?: string;
  items: ProposalItem[];
}

function clp(n: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency", currency: "CLP", maximumFractionDigits: 0,
  }).format(n);
}

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
}

function itemNet(item: ProposalItem) {
  return item.quantity * item.unitPrice;
}

function itemDiscount(item: ProposalItem) {
  return itemNet(item) * item.discount / 100;
}

function itemTax(item: ProposalItem) {
  return (itemNet(item) - itemDiscount(item)) * item.tax / 100;
}

function itemTotal(item: ProposalItem) {
  return itemNet(item) - itemDiscount(item) + itemTax(item);
}

export default function ProposalPrintPage() {
  const params = useParams();
  const id = params?.id as string;
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/crm/proposals/${id}`)
      .then((r) => r.json())
      .then((data) => { setProposal(data); setLoading(false); });
  }, [id]);

  function handlePrint() {
    window.print();
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 print:hidden">
      Cargando propuesta...
    </div>
  );

  if (!proposal) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 print:hidden">
      Propuesta no encontrada.
    </div>
  );

  const totalNeto = proposal.items.reduce((s, i) => s + itemNet(i), 0);
  const totalDescuento = proposal.items.reduce((s, i) => s + itemDiscount(i), 0);
  const totalImpuesto = proposal.items.reduce((s, i) => s + itemTax(i), 0);
  const total = proposal.items.reduce((s, i) => s + itemTotal(i), 0);

  return (
    <>
      {/* Print button - hidden when printing */}
      <div className="print:hidden fixed top-4 right-4 flex gap-2 z-50">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-black shadow-lg"
          style={{ backgroundColor: "#FFC207" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          Descargar / Imprimir PDF
        </button>
        <button
          onClick={() => window.close()}
          className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-white border border-gray-200 shadow"
        >
          Cerrar
        </button>
      </div>

      {/* Document */}
      <div
        ref={printRef}
        className="bg-white min-h-screen"
        style={{ fontFamily: "Arial, sans-serif", fontSize: "11pt", color: "#1a1a1a" }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 48px" }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
            {/* Logo / Company */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <div style={{
                  width: "48px", height: "48px", borderRadius: "12px",
                  background: "#FFC207", display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: "900", fontSize: "20px", color: "#000",
                }}>P</div>
                <div>
                  <div style={{ fontWeight: "800", fontSize: "18pt", lineHeight: 1 }}>Progresa</div>
                  <div style={{ fontSize: "8pt", color: "#999", letterSpacing: "0.1em" }}>AGENCIA</div>
                </div>
              </div>
              <div style={{ fontSize: "9pt", color: "#555", lineHeight: 1.6 }}>
                <div>PROGRESA GROUP Spa</div>
                <div>77.910.002-2</div>
                <div>Avda Oriente 565, Los Ángeles, Región del Bío Bío</div>
                <div>+56 9 9943 7664</div>
                <div>contacto@agenciaprogresa.cl</div>
                <div>www.agenciaprogresa.cl</div>
              </div>
            </div>

            {/* Title */}
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "22pt", fontWeight: "900", lineHeight: 1.1 }}>Propuesta Comercial</div>
              <div style={{ fontSize: "22pt", fontWeight: "900", color: "#FFC207", lineHeight: 1.1 }}>
                {proposal.folio || proposal.id.slice(-10)}
              </div>
            </div>
          </div>

          {/* Client + Meta block */}
          <div style={{
            background: "#f8f8f8", border: "1px solid #e5e5e5", borderRadius: "12px",
            padding: "16px 20px", marginBottom: "24px",
          }}>
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px",
            }}>
              {/* Client */}
              <div>
                <div style={{
                  background: "#FFC207", padding: "4px 12px", borderRadius: "6px",
                  fontWeight: "700", fontSize: "10pt", marginBottom: "10px", display: "inline-block",
                }}>
                  Empresa: {proposal.name} {proposal.clientRut && `/ RUT: ${proposal.clientRut}`}
                </div>
                <div style={{ fontSize: "10pt", lineHeight: 1.8, color: "#444" }}>
                  {proposal.clientAddress && <div>Dirección: {proposal.clientAddress}</div>}
                  {proposal.clientPhone && <div>Teléfono: {proposal.clientPhone}</div>}
                  {proposal.clientEmail && <div>Email: {proposal.clientEmail}</div>}
                </div>
              </div>

              {/* Dates & Agent */}
              <div style={{ fontSize: "10pt", lineHeight: 1.8, color: "#444" }}>
                <div><strong>Fecha de Emisión:</strong> {fmtDate(proposal.issueDate)}</div>
                {proposal.dueDate && <div><strong>Fecha de Vencimiento:</strong> {fmtDate(proposal.dueDate)}</div>}
                <div><strong>Propuesta #:</strong> {proposal.folio || proposal.id.slice(-10)}</div>
                {proposal.agentName && (
                  <>
                    <div style={{ marginTop: "6px" }}><strong>Ejecutivo Comercial:</strong> {proposal.agentName}</div>
                    {proposal.agentPhone && <div><strong>Teléfono:</strong> {proposal.agentPhone}</div>}
                    {proposal.agentEmail && <div><strong>Email:</strong> {proposal.agentEmail}</div>}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          {proposal.termsConditions && (
            <div style={{
              border: "1px solid #e5e5e5", borderRadius: "12px",
              padding: "16px 20px", marginBottom: "24px",
            }}>
              <div style={{
                background: "#FFC207", padding: "4px 12px", borderRadius: "6px",
                fontWeight: "700", fontSize: "10pt", marginBottom: "10px", display: "inline-block",
              }}>
                Terminos y Condiciones
              </div>
              <div style={{ fontSize: "9pt", color: "#555", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                {proposal.termsConditions}
              </div>
            </div>
          )}

          {/* Items table */}
          <table style={{
            width: "100%", borderCollapse: "collapse", marginBottom: "16px",
            border: "1px solid #e5e5e5", borderRadius: "12px", overflow: "hidden",
          }}>
            <thead>
              <tr style={{ background: "#f8f8f8" }}>
                {["Producto", "Descripción", "Cantidad", "Valor Neto", "Impuesto", "Valor Total"].map((h) => (
                  <th key={h} style={{
                    padding: "10px 12px", textAlign: h === "Producto" || h === "Descripción" ? "left" : "center",
                    fontSize: "9pt", fontWeight: "700", color: "#FFC207",
                    borderBottom: "2px solid #FFC207",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {proposal.items.map((item, idx) => (
                <tr key={item.id} style={{ background: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "10px 12px", fontWeight: "500", fontSize: "10pt", borderBottom: "1px solid #eee" }}>
                    {item.name}
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: "9pt", color: "#666", borderBottom: "1px solid #eee", maxWidth: "220px" }}>
                    {item.description || ""}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "center", fontSize: "10pt", borderBottom: "1px solid #eee" }}>
                    {item.quantity}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "center", fontSize: "10pt", borderBottom: "1px solid #eee" }}>
                    {clp(itemNet(item))}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "center", fontSize: "10pt", borderBottom: "1px solid #eee" }}>
                    {item.tax > 0 ? `${item.tax}%` : "0"}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: "600", fontSize: "10pt", borderBottom: "1px solid #eee" }}>
                    {clp(itemTotal(item))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "32px" }}>
            <table style={{ width: "280px", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={{ padding: "6px 12px", fontSize: "10pt", color: "#555" }}>Valor Neto</td>
                  <td style={{ padding: "6px 12px", fontSize: "10pt", textAlign: "right", fontWeight: "600" }}>{clp(totalNeto)}</td>
                </tr>
                {totalDescuento > 0 && (
                  <tr>
                    <td style={{ padding: "6px 12px", fontSize: "10pt", color: "#555" }}>Descuento Total</td>
                    <td style={{ padding: "6px 12px", fontSize: "10pt", textAlign: "right", color: "#e55", fontWeight: "600" }}>-{clp(totalDescuento)}</td>
                  </tr>
                )}
                <tr>
                  <td style={{ padding: "6px 12px", fontSize: "10pt", color: "#555" }}>Impuesto</td>
                  <td style={{ padding: "6px 12px", fontSize: "10pt", textAlign: "right", fontWeight: "600" }}>{clp(totalImpuesto)}</td>
                </tr>
                <tr style={{ borderTop: "2px solid #FFC207" }}>
                  <td style={{ padding: "8px 12px", fontSize: "13pt", fontWeight: "900" }}>Total</td>
                  <td style={{ padding: "8px 12px", fontSize: "13pt", textAlign: "right", fontWeight: "900", color: "#FFC207" }}>{clp(total)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment info */}
          <div style={{
            border: "1px solid #e5e5e5", borderRadius: "12px",
            padding: "16px 20px",
          }}>
            <div style={{
              background: "#FFC207", padding: "4px 12px", borderRadius: "6px",
              fontWeight: "700", fontSize: "10pt", marginBottom: "10px", display: "inline-block",
            }}>
              Datos de Transferencia
            </div>
            <div style={{ fontSize: "10pt", lineHeight: 1.8, color: "#444" }}>
              <div><strong>PROGRESA GROUP SpA</strong></div>
              <div>77.910.002-2</div>
              <div>Banco de Chile · Cuenta Vista</div>
              <div>64-30240-64</div>
              <div>progresa.agency@gmail.com</div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @media print {
          @page { margin: 0; size: A4; }
          body { margin: 0; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </>
  );
}
