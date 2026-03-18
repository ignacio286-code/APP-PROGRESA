export const mockCampaigns = [
  {
    id: "1",
    name: "Lanzamiento Verano 2026",
    description: "Campaña de verano para nuevos productos",
    status: "ACTIVE",
    channel: "SOCIAL",
    startDate: "2026-06-01",
    endDate: "2026-08-31",
    budget: 15000,
    spent: 8400,
    members: ["Ana García", "Luis Pérez"],
  },
  {
    id: "2",
    name: "Email Black Friday",
    description: "Campaña de email marketing para Black Friday",
    status: "DRAFT",
    channel: "EMAIL",
    startDate: "2026-11-20",
    endDate: "2026-11-30",
    budget: 5000,
    spent: 0,
    members: ["María López"],
  },
  {
    id: "3",
    name: "SEO Trimestre Q1",
    description: "Optimización SEO para el primer trimestre",
    status: "COMPLETED",
    channel: "SEO",
    startDate: "2026-01-01",
    endDate: "2026-03-31",
    budget: 8000,
    spent: 7800,
    members: ["Carlos Ruiz", "Ana García"],
  },
  {
    id: "4",
    name: "Google Ads Primavera",
    description: "Anuncios PPC para temporada de primavera",
    status: "ACTIVE",
    channel: "PPC",
    startDate: "2026-03-15",
    endDate: "2026-05-15",
    budget: 12000,
    spent: 3200,
    members: ["Luis Pérez"],
  },
  {
    id: "5",
    name: "Blog Content Q2",
    description: "Estrategia de contenido para Q2",
    status: "PAUSED",
    channel: "CONTENT",
    startDate: "2026-04-01",
    endDate: "2026-06-30",
    budget: 4000,
    spent: 1200,
    members: ["María López", "Carlos Ruiz"],
  },
];

export const mockMetrics = [
  { month: "Oct", impressions: 45000, clicks: 2300, conversions: 180, revenue: 9800 },
  { month: "Nov", impressions: 52000, clicks: 2800, conversions: 210, revenue: 11200 },
  { month: "Dic", impressions: 78000, clicks: 4200, conversions: 380, revenue: 18500 },
  { month: "Ene", impressions: 38000, clicks: 1900, conversions: 145, revenue: 7200 },
  { month: "Feb", impressions: 41000, clicks: 2100, conversions: 162, revenue: 8100 },
  { month: "Mar", impressions: 55000, clicks: 3100, conversions: 245, revenue: 13400 },
];

export const mockTeam = [
  { id: "1", name: "Ana García", email: "ana@marketpro.com", role: "MANAGER", avatar: "AG", campaigns: 3 },
  { id: "2", name: "Luis Pérez", email: "luis@marketpro.com", role: "MEMBER", avatar: "LP", campaigns: 2 },
  { id: "3", name: "María López", email: "maria@marketpro.com", role: "MEMBER", avatar: "ML", campaigns: 2 },
  { id: "4", name: "Carlos Ruiz", email: "carlos@marketpro.com", role: "MEMBER", avatar: "CR", campaigns: 2 },
  { id: "5", name: "Admin User", email: "admin@marketpro.com", role: "ADMIN", avatar: "AU", campaigns: 5 },
];

export const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  DRAFT: "bg-gray-100 text-gray-600",
  PAUSED: "bg-orange-100 text-orange-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export const statusLabels: Record<string, string> = {
  ACTIVE: "Activa",
  DRAFT: "Borrador",
  PAUSED: "Pausada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

export const channelLabels: Record<string, string> = {
  EMAIL: "Email",
  SOCIAL: "Social Media",
  SEO: "SEO",
  PPC: "PPC / Ads",
  CONTENT: "Contenido",
  OTHER: "Otro",
};

export const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  MANAGER: "Manager",
  MEMBER: "Miembro",
};
