import { useState } from "react";
import { Bell, CheckCircle2, MessageSquare, AlertTriangle, X } from "lucide-react";
import { useRealtime } from "../context/RealtimeContext";
import { C, body } from "../theme";

const KIND = {
  created:   { icon: Bell,          tint: "#0F766E", bg: "#E2F1EE" },
  updated:   { icon: CheckCircle2,  tint: "#2563EB", bg: "#E6EEFB" },
  commented: { icon: MessageSquare, tint: "#B45309", bg: "#FBF0DD" },
  escalated: { icon: AlertTriangle, tint: "#DC2626", bg: "#FCEBEB" },
};

const FALLBACK = {
  created: "New ticket created",
  updated: "A ticket was updated",
  commented: "New comment added",
  escalated: "A ticket is breaching SLA",
};

export default function Toasts() {
  const [toasts, setToasts] = useState([]);

 
  useRealtime((p) => {
    if (!p) return;
    const id = (crypto.randomUUID && crypto.randomUUID()) || String(Math.random());
    const toast = { id, kind: p.kind || "updated", message: p.message || FALLBACK[p.kind] || "Ticket updated" };
    setToasts((list) => [...list, toast]);
    // Auto-dismiss after 5s.
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 5000);
  });

  const dismiss = (id) => setToasts((list) => list.filter((t) => t.id !== id));

  if (toasts.length === 0) return null;

  return (
    <div style={{ position: "fixed", bottom: 20, right: 20, display: "flex", flexDirection: "column", gap: 10, zIndex: 100, maxWidth: 360 }}>
      {toasts.map((t) => {
        const style = KIND[t.kind] || KIND.updated;
        const Icon = style.icon;
        return (
          <div key={t.id} className="flex items-start gap-3"
               style={{ background: C.surface, border: `1px solid ${C.line}`, borderLeft: `3px solid ${style.tint}`,
                        borderRadius: 12, padding: "12px 14px", boxShadow: "0 8px 24px rgba(15,17,23,.12)", ...body }}>
            <div className="flex items-center justify-center"
                 style={{ width: 30, height: 30, borderRadius: 8, background: style.bg, color: style.tint, flexShrink: 0 }}>
              <Icon size={16} />
            </div>
            <div style={{ flex: 1, fontSize: 13.5, color: C.ink, lineHeight: 1.4 }}>{t.message}</div>
            <button onClick={() => dismiss(t.id)} style={{ border: "none", background: "transparent", cursor: "pointer", color: C.inkFaint, flexShrink: 0 }}>
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}