"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Server } from "@/lib/definitions";
import { backendFetch, unwrapList, extractErrorMessage } from "@/lib/backend-client";

type ServersState = {
  servers: Server[];
  loading: boolean;
  refreshServers: () => Promise<void>;
};

const ServersContext = createContext<ServersState>({
  servers: [],
  loading: true,
  refreshServers: () => Promise.resolve(),
});

export function ServersProvider({ children }: { children: ReactNode }) {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshServers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await backendFetch("/api/servers", { cache: "no-store" });
      if (!res.ok) {
        const msg = await extractErrorMessage(res, "No se pudieron cargar los servidores");
        throw new Error(msg);
      }
      const body = await res.json();
      const list = unwrapList<Server>(body, "servers");
      setServers(list);
    } catch (error) {
      console.error("Error loading servers:", error);
      setServers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshServers();
  }, [refreshServers]);

  return (
    <ServersContext.Provider value={{ servers, loading, refreshServers }}>
      {children}
    </ServersContext.Provider>
  );
}

export function useServers() {
  return useContext(ServersContext);
}
