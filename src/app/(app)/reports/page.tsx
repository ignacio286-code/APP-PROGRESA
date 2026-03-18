"use client";

import Header from "@/components/Header";
import { mockMetrics, mockCampaigns } from "@/lib/mock-data";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const COLORS = ["#FFC207", "#000000", "#6b7280", "#d1d5db"];

const channelData = [
  { name: "Social", value: 35 },
  { name: "Email", value: 25 },
  { name: "PPC", value: 20 },
  { name: "SEO", value: 20 },
];

export default function ReportsPage() {
  const totalBudget = mockCampaigns.reduce((s, c) => s + (c.budget || 0), 0);
  const totalSpent = mockCampaigns.reduce((s, c) => s + (c.spent || 0), 0);
  const totalRevenue = mockMetrics.reduce((s, m) => s + m.revenue, 0);
  const totalConversions = mockMetrics.reduce((s, m) => s + m.conversions, 0);

  return (
    <div>
      <Header title="Reportes" subtitle="Análisis y métricas de rendimiento" />

      <div className="p-6 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: "Presupuesto total", value: `$${totalBudget.toLocaleString()}` },
            { label: "Total gastado", value: `$${totalSpent.toLocaleString()}` },
            { label: "Ingresos totales", value: `$${totalRevenue.toLocaleString()}` },
            { label: "Total conversiones", value: totalConversions },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Line chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Conversiones vs Clics</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={mockMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8 }} />
                <Legend />
                <Line type="monotone" dataKey="clicks" name="Clics" stroke="#FFC207" strokeWidth={2} dot={{ fill: "#FFC207" }} />
                <Line type="monotone" dataKey="conversions" name="Conversiones" stroke="#000000" strokeWidth={2} dot={{ fill: "#000" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Distribución por Canal</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={channelData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}%`}
                  labelLine={false}
                >
                  {channelData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar chart full */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Impresiones mensuales</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mockMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 8 }} />
              <Bar dataKey="impressions" name="Impresiones" fill="#FFC207" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
