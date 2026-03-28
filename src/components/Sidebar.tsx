"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Megaphone,
  Calendar,
  Users,
  BarChart2,
  Settings,
  ChevronLeft,
  ChevronRight,
  UserSquare2,
  Search,
  Globe,
  Image,
  Video,
  Cpu,
  Building2,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Briefcase,
  FileText,
  Package,
  Server,
  LineChart,
  FileBarChart2,
  X,
  Share2,
} from "lucide-react";
import { useState } from "react";
import { useClient } from "@/lib/client-context";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  prefix: string;
  items: NavItem[];
}

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const navGroups: NavGroup[] = [
  {
    label: "Clientes",
    icon: UserSquare2,
    prefix: "/clients",
    items: [
      { href: "/clients", label: "Gestión de Clientes", icon: UserSquare2 },
    ],
  },
  {
    label: "Analítica",
    icon: LineChart,
    prefix: "/analytics",
    items: [
      { href: "/analytics", label: "Resumen General", icon: LineChart },
      { href: "/analytics/facebook", label: "Facebook", icon: BarChart2 },
      { href: "/analytics/instagram", label: "Instagram", icon: Image },
      { href: "/analytics/youtube", label: "YouTube", icon: Video },
      { href: "/analytics/tiktok", label: "TikTok", icon: Cpu },
      { href: "/analytics/linkedin", label: "LinkedIn", icon: Briefcase },
      { href: "/analytics/google_ads", label: "Google Ads", icon: DollarSign },
      { href: "/analytics/reports", label: "Informes", icon: FileBarChart2 },
    ],
  },
  {
    label: "SEO",
    icon: Search,
    prefix: "/seo",
    items: [
      { href: "/seo/connector", label: "Conector WordPress", icon: Globe },
      { href: "/seo/analyzer", label: "Analizador SEO", icon: Search },
      { href: "/seo/content", label: "Generador de Contenido", icon: Cpu },
    ],
  },
  {
    label: "Paid Media",
    icon: DollarSign,
    prefix: "/paid-media",
    items: [
      { href: "/paid-media/connections", label: "Configurar Conexiones", icon: Settings },
      { href: "/paid-media/meta", label: "Campañas Meta", icon: Megaphone },
      { href: "/paid-media/google", label: "Campañas Google Ads", icon: BarChart2 },
    ],
  },
  {
    label: "Contenido",
    icon: Image,
    prefix: "/content",
    items: [
      { href: "/content/images", label: "Generador de Imágenes", icon: Image },
      { href: "/content/videos", label: "Generador de Videos", icon: Video },
      { href: "/content/avatar", label: "Avatar con Rostro", icon: Users },
    ],
  },
  {
    label: "Sitios Web",
    icon: Globe,
    prefix: "/websites",
    items: [
      { href: "/websites/informative", label: "Sitio Informativo", icon: Globe },
      { href: "/websites/ecommerce", label: "Tienda WooCommerce", icon: Building2 },
    ],
  },
  {
    label: "Social Media",
    icon: Share2,
    prefix: "/social-media",
    items: [
      { href: "/social-media", label: "Panel Social Media", icon: Share2 },
    ],
  },
  {
    label: "CRM",
    icon: Briefcase,
    prefix: "/crm",
    items: [
      { href: "/crm", label: "Área Comercial", icon: Briefcase },
      { href: "/crm/intake", label: "Toma de Requerimientos", icon: FileText },
      { href: "/crm/leads", label: "Clientes Potenciales", icon: Users },
      { href: "/crm/proposals", label: "Propuestas", icon: FileText },
      { href: "/crm/clients", label: "Clientes Progresa", icon: Building2 },
      { href: "/crm/services", label: "Servicios", icon: Package },
      { href: "/crm/hosting", label: "Clientes Hosting", icon: Server },
      { href: "/crm/documents", label: "Documentación", icon: FileText },
    ],
  },
];

const bottomNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/campaigns", label: "Campañas", icon: Megaphone },
  { href: "/calendar", label: "Calendario", icon: Calendar },
  { href: "/team", label: "Equipo", icon: Users },
  { href: "/reports", label: "Reportes", icon: BarChart2 },
  { href: "/settings", label: "Configuración", icon: Settings },
];

export default function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { activeClient } = useClient();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Clientes: true,
    "Analítica": false,
    SEO: false,
    "Paid Media": false,
    Contenido: false,
    "Sitios Web": false,
    "Social Media": false,
    CRM: false,
  });

  function toggleGroup(label: string) {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  function handleNavClick() {
    onMobileClose?.();
  }

  return (
    <aside
      className={`flex flex-col h-screen bg-black text-white transition-all duration-300 fixed left-0 top-0 z-50
        ${collapsed ? "md:w-16" : "md:w-64"} w-64
        ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/10 shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex flex-col leading-none">
              <span className="font-black text-xl tracking-tight text-white">Progresa</span>
              <span className="text-xs font-semibold italic" style={{ color: "#FFC207" }}>Agencia</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto" style={{ backgroundColor: "#FFC207" }}>
            <Megaphone size={16} className="text-black" />
          </div>
        )}
        <div className="flex items-center gap-2">
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="hidden md:flex text-white/50 hover:text-white transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          {/* Mobile close button */}
          <button
            onClick={onMobileClose}
            className="md:hidden text-white/50 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Active Client Badge */}
      {!collapsed && activeClient && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-lg border border-yellow-400/30 bg-yellow-400/10">
          <p className="text-xs text-yellow-400/70">Cliente activo</p>
          <p className="text-sm font-semibold text-yellow-400 truncate">{activeClient.name}</p>
        </div>
      )}
      {collapsed && activeClient && (
        <div className="mx-auto mt-3 w-8 h-8 rounded-full flex items-center justify-center text-black text-xs font-bold" style={{ backgroundColor: "#FFC207" }}>
          {activeClient.name.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto space-y-1">
        {navGroups.map((group) => {
          const isGroupActive = pathname.startsWith(group.prefix);
          const isOpen = openGroups[group.label];
          const GroupIcon = group.icon;

          return (
            <div key={group.label}>
              {!collapsed ? (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className={`w-full flex items-center justify-between px-4 py-2 text-left transition-colors ${
                    isGroupActive ? "text-yellow-400" : "text-white/60 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <GroupIcon size={16} className="shrink-0" />
                    <span className="text-xs font-semibold uppercase tracking-wider">{group.label}</span>
                  </div>
                  {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              ) : (
                <div
                  className={`flex justify-center py-2 ${isGroupActive ? "text-yellow-400" : "text-white/40"}`}
                  title={group.label}
                >
                  <GroupIcon size={16} />
                </div>
              )}

              {(isOpen || collapsed) &&
                group.items.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href || pathname.startsWith(href + "/");
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={handleNavClick}
                      className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg mb-0.5 transition-all text-sm ${
                        active
                          ? "text-black font-semibold"
                          : "text-white/70 hover:text-white hover:bg-white/10"
                      }`}
                      style={active ? { backgroundColor: "#FFC207" } : {}}
                      title={collapsed ? label : undefined}
                    >
                      <Icon size={18} className="shrink-0" />
                      {!collapsed && <span>{label}</span>}
                    </Link>
                  );
                })}
            </div>
          );
        })}

        <div className="mx-4 border-t border-white/10 my-2" />

        {bottomNav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={handleNavClick}
              className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg mb-0.5 transition-all text-sm ${
                active
                  ? "text-black font-semibold"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
              style={active ? { backgroundColor: "#FFC207" } : {}}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse button (desktop, when collapsed) */}
      {collapsed && (
        <div className="py-4 hidden md:flex justify-center shrink-0">
          <button
            onClick={() => setCollapsed(false)}
            className="text-white/50 hover:text-white transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* User profile */}
      {!collapsed && (
        <div className="border-t border-white/10 p-4 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-black font-bold text-sm shrink-0"
              style={{ backgroundColor: "#FFC207" }}
            >
              A
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">Admin</p>
              <p className="text-xs text-white/50 truncate">Progresa Agencia</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
