"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { mockTeam, roleLabels } from "@/lib/mock-data";
import { Plus, Mail, Trash2, Edit, Search } from "lucide-react";

const roleColors: Record<string, string> = {
  ADMIN: "bg-black text-white",
  MANAGER: "bg-yellow-100 text-yellow-800",
  MEMBER: "bg-gray-100 text-gray-600",
};

export default function TeamPage() {
  const [team, setTeam] = useState(mockTeam);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "MEMBER" });

  const filtered = team.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const initials = form.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    const newMember = {
      id: String(team.length + 1),
      name: form.name,
      email: form.email,
      role: form.role,
      avatar: initials,
      campaigns: 0,
    };
    setTeam([...team, newMember]);
    setShowModal(false);
    setForm({ name: "", email: "", role: "MEMBER" });
  }

  function handleDelete(id: string) {
    setTeam(team.filter((m) => m.id !== id));
  }

  return (
    <div>
      <Header title="Equipo" subtitle={`${team.length} miembros en el equipo`} />

      <div className="p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex items-center">
            <Search size={15} className="absolute left-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar miembro..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 w-56"
            />
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-black hover:opacity-90"
            style={{ backgroundColor: "#FFC207" }}
          >
            <Plus size={16} />
            Agregar miembro
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Administradores", count: team.filter((m) => m.role === "ADMIN").length, color: "bg-black text-white" },
            { label: "Managers", count: team.filter((m) => m.role === "MANAGER").length, color: "bg-yellow-50 text-yellow-700" },
            { label: "Miembros", count: team.filter((m) => m.role === "MEMBER").length, color: "bg-gray-50 text-gray-700" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
              <p className="text-2xl font-bold">{s.count}</p>
              <p className="text-sm opacity-80">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Team grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((member) => (
            <div key={member.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-black font-bold text-sm"
                    style={{ backgroundColor: "#FFC207" }}
                  >
                    {member.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{member.name}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Mail size={11} />
                      {member.email}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600">
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(member.id)}
                    className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${roleColors[member.role]}`}>
                  {roleLabels[member.role]}
                </span>
                <span className="text-xs text-gray-400">{member.campaigns} campañas</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Agregar Miembro</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="Ej: Ana García"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="ana@empresa.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="ADMIN">Administrador</option>
                  <option value="MANAGER">Manager</option>
                  <option value="MEMBER">Miembro</option>
                </select>
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
                  Agregar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
