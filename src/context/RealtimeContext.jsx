import { createContext, useContext, useEffect, useRef, useState } from "react";
import { HubConnectionBuilder, LogLevel, HubConnectionState } from "@microsoft/signalr";
import { useAuth } from "./AuthContext";

const RealtimeContext = createContext(null);


export function RealtimeProvider({ children }) {
  const { token } = useAuth();
  const handlersRef = useRef(new Set());
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) { setConnected(false); return; } 

    const conn = new HubConnectionBuilder()
      .withUrl(`${import.meta.env.VITE_API_URL}/hubs/tickets`, {
       
        accessTokenFactory: () => sessionStorage.getItem("triage_token") || "",
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    conn.on("TicketChanged", (payload) => {
      for (const h of handlersRef.current) {
        try { h(payload); } catch (e) { console.error("realtime handler error:", e); }
      }
    });

    conn.onreconnecting(() => setConnected(false));
    conn.onreconnected(() => setConnected(true));
    conn.onclose(() => setConnected(false));

    conn.start()
      .then(() => setConnected(conn.state === HubConnectionState.Connected))
      .catch((err) => { console.warn("SignalR connect failed:", err); setConnected(false); });

    return () => { setConnected(false); conn.stop().catch(() => {}); };
  }, [token]);

  const subscribe = (handler) => {
    handlersRef.current.add(handler);
    return () => handlersRef.current.delete(handler);
  };

  return (
    <RealtimeContext.Provider value={{ subscribe, connected }}>
      {children}
    </RealtimeContext.Provider>
  );
}


export function useRealtime(handler) {
  const ctx = useContext(RealtimeContext);
  const ref = useRef(handler);
  ref.current = handler;

  useEffect(() => {
    if (!ctx) return;
    return ctx.subscribe((p) => ref.current?.(p));
  }, [ctx]);
}

export function useRealtimeStatus() {
  const ctx = useContext(RealtimeContext);
  return ctx?.connected ?? false;
}