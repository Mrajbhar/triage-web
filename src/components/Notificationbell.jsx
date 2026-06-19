import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { useRealtime } from "../context/RealtimeContext";
import { C, display, body } from "../theme";

const iconBtn = {
  position: "relative",
  width: 38, height: 38, borderRadius: 10, border: `1px solid ${C.line}`,
  background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
};

const dotColor = (kind) =>
  ({ created: "#0F766E", updated: "#2563EB", commented: "#B45309", escalated: "#DC2626" }[kind] || C.inkFaint);

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  // Same live stream the toasts use. Keep the last 30 in memory.
  useRealtime((p) => {
    if (!p) return;
    const id = (crypto.randomUUID && crypto.randomUUID()) || String(Math.random());
    setItems((list) => [
      { id, kind: p.kind, message: p.message || "Ticket updated", ticketId: p.ticketId, at: new Date() },
      ...list,
    ].slice(0, 30));
    setUnread((n) => n + 1);
  });

  const toggle = () => {
    setOpen((o) => {
      if (!o) setUnread(0); // opening clears the unread badge
      return !o;
    });
  };

  const openTicket = (ticketId) => {
    setOpen(false);
    if (ticketId) navigate(`/tickets/${ticketId}`);
  };

  return (
    <div style={{ position: "relative" }}>
      <button onClick={toggle} style={iconBtn} title="Notifications">
        <Bell size={18} color={C.inkSoft} />
        {unread > 0 && (
          <span style={{
            position: "absolute", top: -5, right: -5, minWidth: 17, height: 17, padding: "0 4px",
            borderRadius: 9, background: C.danger, color: "#fff", fontSize: 10, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", ...body,
          }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* click-away backdrop */}
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />

          <div style={{
            position: "absolute", right: 0, top: 46, width: 330, background: C.surface,
            border: `1px solid ${C.line}`, borderRadius: 12, boxShadow: "0 12px 32px rgba(15,17,23,.15)",
            zIndex: 50, overflow: "hidden", ...body,
          }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.lineSoft}`, ...display, fontSize: 14, fontWeight: 600 }}>
              Notifications
            </div>

            <div style={{ maxHeight: 360, overflowY: "auto" }}>
              {items.length === 0 ? (
                <div style={{ padding: "26px 16px", textAlign: "center", color: C.inkFaint, fontSize: 13.5 }}>
                  Nothing yet. Activity shows up here live.
                </div>
              ) : (
                items.map((n) => (
                  <div key={n.id} onClick={() => openTicket(n.ticketId)} className="flex items-start gap-2"
                       style={{ padding: "11px 16px", borderBottom: `1px solid ${C.lineSoft}`, cursor: "pointer" }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor(n.kind), marginTop: 6, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.4 }}>{n.message}</div>
                      <div style={{ fontSize: 11.5, color: C.inkFaint, marginTop: 2 }}>{timeAgo(n.at)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}