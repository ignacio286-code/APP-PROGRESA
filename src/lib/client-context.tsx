"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Client {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  logoUrl?: string;
  wpUrl?: string;
  wpUsername?: string;
  wpAppPassword?: string;
  metaAppId?: string;
  metaAppSecret?: string;
  metaAccessToken?: string;
  metaAdAccountId?: string;
  googleClientId?: string;
  googleClientSecret?: string;
  googleDeveloperToken?: string;
  googleRefreshToken?: string;
  googleCustomerId?: string;
  nanobanaApiKey?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ClientContextType {
  clients: Client[];
  activeClient: Client | null;
  setActiveClient: (client: Client) => void;
  refreshClients: () => Promise<void>;
  loading: boolean;
}

const ClientContext = createContext<ClientContextType>({
  clients: [],
  activeClient: null,
  setActiveClient: () => {},
  refreshClients: async () => {},
  loading: false,
});

export function ClientProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [activeClient, setActiveClientState] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshClients() {
    try {
      const res = await fetch("/api/clients");
      if (res.ok) {
        const data: Client[] = await res.json();
        setClients(data);
        const active = data.find((c) => c.isActive) ?? null;
        setActiveClientState(active);
      }
    } catch {
      // ignore network errors
    } finally {
      setLoading(false);
    }
  }

  async function setActiveClient(client: Client) {
    try {
      await fetch(`/api/clients/${client.id}/activate`, { method: "POST" });
      setActiveClientState(client);
      setClients((prev) =>
        prev.map((c) => ({ ...c, isActive: c.id === client.id }))
      );
    } catch {
      setActiveClientState(client);
    }
  }

  useEffect(() => {
    refreshClients();
  }, []);

  return (
    <ClientContext.Provider value={{ clients, activeClient, setActiveClient, refreshClients, loading }}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  return useContext(ClientContext);
}
