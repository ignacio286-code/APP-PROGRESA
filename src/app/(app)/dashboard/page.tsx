"use client";

import Header from "@/components/Header";
import { mockCampaigns, mockMetrics, statusColors, statusLabels, channelLabels } from "@/lib/mock-data";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { TrendingUp, Megaphone, Users, DollarSign, Eye } from "lucide-react";

const stats = [
  {
    label: "Campañas Activas",
    value: "4",
    change: "+2 este mes",
    icon: Megaphone,
    positive: true,
  },
  {
    label: "Impresiones",
    value: "55,000",
    change: "+34% vs mes anterior",
    icon: Eye,
    positive: true,
  },
  {
    label: "Conversiones",
    value: "245",
    change: "+51% vs mes anterior",
    icon: TrendingUp,
    positive: true,
  },
  {
    label: "Ingresos",
    value: "$13,400",
    change: "+65% vs mes anterior",
    icon: DollarSign,
    positive: true,
  },
];

export default function DashboardPage() {
  const activeCampaigns = mockCampaigns.filter((c) => c.status === "ACTIVE");

  return (
    <div>
      <Header title="Dashboard" subtitle="Resumen general de tus campañas" />

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className={`text-xs mt-1 ${stat.positive ? "text-green-600" : "text-red-600"}`}>
                    {stat.change}
                  </p>
                </div>
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "#FFC20720" }}
                >
                  <stat.icon size={20} style={{ color: "#FFC207" }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Area chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Ingresos por mes</h2>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={mockMetrics}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFC207" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FFC207" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [`$${Number(value).toLocaleString()}`, "Ingresos"]}
                  contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#FFC207"
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Bar chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Clics e Impresiones</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={mockMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }} />
                <Bar dataKey="clicks" name="Clics" fill="#FFC207" radius={[4, 4, 0, 0]} />
                <Bar dataKey="conversions" name="Conversiones" fill="#000000" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active Campaigns */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Campañas Activas</h2>
            <a href="/campaigns" className="text-xs font-medium" style={{ color: "#FFC207" }}>
              Ver todas →
            </a>
          </div>
          <div className="space-y-3">
            {activeCampaigns.map((campaign) => {
              const progress = campaign.budget ? Math.round((campaign.spent / campaign.budget) * 100) : 0;
              return (
                <div key={campaign.id} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 truncate">{campaign.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[campaign.status]}`}>
                        {statusLabels[campaign.status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full"
                          style={{ width: `${progress}%`, backgroundColor: "#FFC207" }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{progress}%</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      ${campaign.spent?.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">de ${campaign.budget?.toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
