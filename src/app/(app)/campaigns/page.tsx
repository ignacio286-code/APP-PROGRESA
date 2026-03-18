"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { mockCampaigns, statusColors, statusLabels, channelLabels } from "@/lib/mock-data";
import { Plus, Search, Filter, Edit, Trash2, Eye, TrendingUp } from "lucide-react";

const channels = ["Todos", "EMAIL", "SOCIAL", "SEO", "PPC", "CONTENT"];
const statuses = ["Todos", "ACTIVE", "DRAFT", "PAUSED", "COMPLETED", "CANCELLED"];

export default function CampaignsPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterChannel, setFilterChannel] = useState("Todos");
  const [showModal, setShowModal] = useState(false);
  const [campaigns, setCampaigns] = useState(mockCampaigns);
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "DRAFT",
    channel: "SOCIAL",
    startDate: "",
    endDate: "",
    budget: "",
  });

  const filtered = campaigns.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "Todos" || c.status === filterStatus;
    const matchChannel = filterChannel === "Todos" || c.channel === filterChannel;
    return matchSearch && matchStatus && matchChannel;
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newCampaign = {
      id: String(campaigns.length + 1),
      name: form.name,
      description: form.description,
      status: form.status,
      channel: form.channel,
      startDate: form.startDate,
      endDate: form.endDate,
      budget: Number(form.budget),
      spent: 0,
      members: [],
    };
    setCampaigns([...campaigns, newCampaign]);
    setShowModal(false);
    setForm({ name: "", description: "", status: "DRAFT", channel: "SOCIAL", startDate: "", endDate: "", budget: "" });
  }

  function handleDelete(id: string) {
    setCampaigns(campaigns.filter((c) => c.id !== id));
  }

  return (
    <div>
      <Header title="Campañas" subtitle={`${campaigns.length} campañas en total`} />

      <div className="p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex items-center">
              <Search size={15} className="absolute left-3 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar campaña..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 w-56"
              />
            </div>

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>{s === "Todos" ? "Estado: Todos" : statusLabels[s]}</option>
              ))}
            </select>

            {/* Channel filter */}
            <select
              value={filterChannel}
              onChange={(e) => setFilterChannel(e.target.value)}
              className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none"
            >
              {channels.map((c) => (
                <option key={c} value={c}>{c === "Todos" ? "Canal: Todos" : channelLabels[c]}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-black transition-colors hover:opacity-90"
            style={{ backgroundColor: "#FFC207" }}
          >
            <Plus size={16} />
            Nueva campaña
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Campaña</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Canal</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Estado</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Fechas</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Presupuesto</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Progreso</th>
                <th className="text-right px-5 py-3 text-gray-500 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((campaign) => {
                const progress = campaign.budget ? Math.round((campaign.spent / campaign.budget) * 100) : 0;
                return (
                  <tr key={campaign.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">{campaign.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{campaign.description}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-gray-600">{channelLabels[campaign.channel]}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[campaign.status]}`}>
                        {statusLabels[campaign.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      <p>{campaign.startDate}</p>
                      <p className="text-xs">→ {campaign.endDate}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">${campaign.budget?.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">${campaign.spent?.toLocaleString()} gastado</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full"
                            style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: "#FFC207" }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{progress}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                          <Eye size={15} />
                        </button>
                        <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(campaign.id)}
                          className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-gray-400">
                    No se encontraron campañas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nueva Campaña */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Nueva Campaña</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="Ej: Campaña de verano 2026"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                  rows={2}
                  placeholder="Descripción de la campaña..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Canal</label>
                  <select
                    value={form.channel}
                    onChange={(e) => setForm({ ...form, channel: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  >
                    {["EMAIL", "SOCIAL", "SEO", "PPC", "CONTENT", "OTHER"].map((c) => (
                      <option key={c} value={c}>{channelLabels[c]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  >
                    {["DRAFT", "ACTIVE", "PAUSED"].map((s) => (
                      <option key={s} value={s}>{statusLabels[s]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio *</label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin *</label>
                  <input
                    type="date"
                    required
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Presupuesto ($)</label>
                <input
                  type="number"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="Ej: 10000"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg text-sm font-semibold text-black hover:opacity-90"
                  style={{ backgroundColor: "#FFC207" }}
                >
                  Crear Campaña
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
