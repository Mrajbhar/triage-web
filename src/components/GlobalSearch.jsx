import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Ticket as TicketIcon, User as UserIcon } from "lucide-react";
import { getTickets, getUsers } from "../api";
import { C, body } from "../theme";
import { initials } from "../lib/tickets";

export default function GlobalSearch() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const inputRef = useRef(null);

  // Fetch once on first focus, then filter client-side as the user types.
  const ensureData = () => {
    if (loaded) return;
    Promise.all([getTickets().catch(() => []), getUsers().catch(() => [])])
      .then(([t, u]) => { setTickets(t); setUsers(u); setLoaded(true); });
  };

  // Let the "/" shortcut focus this input from anywhere.
  useEffect(() => {
    const focus = () => { inputRef.current?.focus(); ensureData(); };
    window.addEventListener("triage:focus-search", focus);
    return () => window.removeEventListener("triage:focus-search", focus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const term = q.trim().toLowerCase();
  const tMatches = term ? tickets.filter((t) => (t.subject || "").toLowerCase().includes(term)).slice(0, 6) : [];
  const uMatches = term ? users.filter((u) =>
    (u.fullName || "").toLowerCase().includes(term) || (u.email || "").toLowerCase().includes(term)).slice(0, 4) : [];
  const showPanel = open && term.length > 0;

  const go = (path) => { setOpen(false); setQ(""); navigate(path); };

  return (
    <div style={{ position: "relative", width: 320, maxWidth: "100%", minWidth: 0 }}>
      <div className="flex items-center gap-2"
           style={{ background: C.bg, borderRadius: 10, padding: "9px 13px", border: `1px solid ${showPanel ? C.line : "transparent"}` }}>
        <Search size={16} color={C.inkFaint} style={{ flexShrink: 0 }} />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => { setOpen(true); ensureData(); }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search tickets, people…   /"
          style={{ border: "none", background: "transparent", outline: "none", fontSize: 14, width: "100%", minWidth: 0, ...body, color: C.ink }}
        />
      </div>

      {showPanel && (
        <div className="scale-in"
             style={{ position: "absolute", left: 0, right: 0, top: 46, background: C.surface, border: `1px solid ${C.line}`,
                      borderRadius: 12, boxShadow: "0 12px 32px var(--shadow)", zIndex: 60, overflow: "hidden", ...body }}>
          {tMatches.length === 0 && uMatches.length === 0 ? (
            <div style={{ padding: "18px 16px", fontSize: 13.5, color: C.inkFaint }}>
              No matches for “{q.trim()}”.
            </div>
          ) : (
            <div style={{ maxHeight: 380, overflowY: "auto" }}>
              {tMatches.length > 0 && (
                <Section label="Tickets">
                  {tMatches.map((t) => (
                    <Row key={t.id} onClick={() => go(`/tickets/${t.id}`)}
                         icon={<TicketIcon size={15} color={C.inkFaint} />}
                         title={t.subject} sub={`${t.status} · ${t.priority}`} />
                  ))}
                </Section>
              )}
              {uMatches.length > 0 && (
                <Section label="People">
                  {uMatches.map((u) => (
                    <Row key={u.id} onClick={() => go("/people")}
                         icon={<Avatar name={u.fullName} />}
                         title={u.fullName} sub={u.email} />
                  ))}
                </Section>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div>
      <div style={{ padding: "10px 16px 4px", fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: C.inkFaint }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function Row({ icon, title, sub, onClick }) {
  return (
    <div onMouseDown={onClick} className="flex items-center gap-3 row-hover"
         style={{ padding: "9px 16px", cursor: "pointer" }}
         onMouseOver={(e) => (e.currentTarget.style.background = C.bg)}
         onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}>
      <div style={{ width: 26, display: "flex", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
        <div style={{ fontSize: 12, color: C.inkFaint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</div>
      </div>
    </div>
  );
}

function Avatar({ name }) {
  return (
    <div className="flex items-center justify-center"
         style={{ width: 24, height: 24, borderRadius: "50%", background: C.panel, color: "#fff", fontSize: 10, fontWeight: 600 }}>
      {initials(name)}
    </div>
  );
}