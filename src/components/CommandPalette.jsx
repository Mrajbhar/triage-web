import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, LayoutDashboard, Inbox, BarChart3, Users, Timer, Settings as SettingsIcon,
  Plus, Moon, Sun, LogOut, Ticket, CornerDownLeft,
} from "lucide-react";
import { getTickets } from "../api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { C, body } from "../theme";
import { normalise } from "../lib/tickets";

export default function CommandPalette({ onClose, onNewTicket }) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const role = (user?.role || "").toLowerCase();

  const [query, setQuery] = useState("");
  const [tickets, setTickets] = useState([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const activeRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    getTickets().then((d) => setTickets(d.map(normalise))).catch(() => {});
    return () => { document.body.style.overflow = prev; };
  }, []);

  const can = (roles) => !role || roles.includes(role);
  const go = (path) => () => navigate(path);

  const commands = useMemo(() => {
    const actions = [
      { id: "act-new",     group: "Actions", label: "New ticket",  icon: Plus,   run: () => onNewTicket?.() },
      { id: "act-theme",   group: "Actions", label: theme === "dark" ? "Switch to light mode" : "Switch to dark mode", icon: theme === "dark" ? Sun : Moon, run: () => toggle() },
      { id: "act-signout", group: "Actions", label: "Sign out",    icon: LogOut, run: () => signOut() },
    ];
    const nav = [
      { id: "nav-dash",     group: "Go to", label: "Dashboard",    icon: LayoutDashboard, run: go("/"),         roles: ["admin", "agent", "requester"] },
      { id: "nav-tickets",  group: "Go to", label: "Tickets",      icon: Inbox,           run: go("/tickets"),  roles: ["admin", "agent", "requester"] },
      { id: "nav-reports",  group: "Go to", label: "Reports",      icon: BarChart3,       run: go("/reports"),  roles: ["admin", "agent"] },
      { id: "nav-people",   group: "Go to", label: "People",       icon: Users,           run: go("/people"),   roles: ["admin", "agent"] },
      { id: "nav-sla",      group: "Go to", label: "SLA policies", icon: Timer,           run: go("/sla"),      roles: ["admin"] },
      { id: "nav-settings", group: "Go to", label: "Settings",     icon: SettingsIcon,    run: go("/settings"), roles: ["admin", "agent", "requester"] },
    ].filter((c) => can(c.roles));
    return [...actions, ...nav];
  }, [role, theme, navigate, toggle, signOut, onNewTicket]);

  const q = query.trim().toLowerCase();

  const filteredCommands = useMemo(
    () => (q ? commands.filter((c) => c.label.toLowerCase().includes(q)) : commands),
    [q, commands]
  );

  const ticketResults = useMemo(() => {
    if (!q) return [];
    return tickets
      .filter((t) => t.subject.toLowerCase().includes(q) || (t.ref || "").toLowerCase().includes(q))
      .slice(0, 6)
      .map((t) => ({ id: `tk-${t.id}`, group: "Tickets", label: t.subject, sub: t.ref, icon: Ticket, run: () => navigate(`/tickets/${t.id}`) }));
  }, [q, tickets, navigate]);

  const items = useMemo(() => [...filteredCommands, ...ticketResults], [filteredCommands, ticketResults]);

  useEffect(() => { setActive(0); }, [q]);
  useEffect(() => { activeRef.current?.scrollIntoView({ block: "nearest" }); }, [active]);

  const run = (item) => { if (!item) return; item.run?.(); onClose(); };

  const onKeyDown = (e) => {
    if (e.key === "Escape") { onClose(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, items.length - 1)); }
    else if (e.key === "ArrowUp")   { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter")     { e.preventDefault(); run(items[active]); }
  };

  let lastGroup = null;

  return (
    <div onClick={onClose} className="overlay-in"
         style={{ position: "fixed", inset: 0, background: "rgba(15,17,23,.5)", display: "flex",
                  alignItems: "flex-start", justifyContent: "center", padding: "12vh 20px 20px", zIndex: 70 }}>
      <div onClick={(e) => e.stopPropagation()} className="scale-in"
           role="dialog" aria-modal="true" aria-label="Command palette"
           style={{ width: "100%", maxWidth: 560, background: C.surface, border: `1px solid ${C.line}`,
                    borderRadius: 14, overflow: "hidden", boxShadow: "0 24px 60px -24px rgba(0,0,0,.45)", ...body }}>
        {/* Search row */}
        <div className="flex items-center gap-3" style={{ padding: "14px 16px", borderBottom: `1px solid ${C.lineSoft}` }}>
          <Search size={18} color={C.inkFaint} />
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={onKeyDown}
                 placeholder="Search or jump to…"
                 style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 15, color: C.ink, ...body }} />
          <span style={{ fontSize: 11, color: C.inkFaint, fontFamily: "ui-monospace, monospace", border: `1px solid ${C.line}`, borderRadius: 6, padding: "2px 6px" }}>esc</span>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 360, overflowY: "auto", padding: 6 }}>
          {items.length === 0 && (
            <div style={{ padding: "28px 16px", textAlign: "center", color: C.inkFaint, fontSize: 14 }}>
              No matches for “{query}”.
            </div>
          )}
          {items.map((item, i) => {
            const showGroup = item.group !== lastGroup; lastGroup = item.group;
            const isActive = i === active;
            const Icon = item.icon;
            return (
              <div key={item.id}>
                {showGroup && (
                  <div style={{ fontSize: 11, color: C.inkFaint, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, padding: "10px 10px 4px" }}>
                    {item.group}
                  </div>
                )}
                <div ref={isActive ? activeRef : null}
                     onMouseEnter={() => setActive(i)} onClick={() => run(item)}
                     className="flex items-center gap-3"
                     style={{ padding: "9px 10px", borderRadius: 9, cursor: "pointer", background: isActive ? C.brandSoft : "transparent" }}>
                  <Icon size={16} color={isActive ? C.brandDark : C.inkFaint} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 500, color: isActive ? C.brandDark : C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.label}
                  </span>
                  {item.sub && <span style={{ fontSize: 12, color: C.inkFaint, flexShrink: 0 }}>{item.sub}</span>}
                  {isActive && <CornerDownLeft size={14} color={C.inkFaint} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}