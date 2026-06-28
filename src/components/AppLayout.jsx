import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Inbox, LayoutDashboard, Ticket, Users, Settings, LogOut, Plus, Menu, Sun, Moon, BarChart3, Timer, Command,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useRealtimeStatus } from "../context/RealtimeContext";
import { C, display, body } from "../theme";
import { initials } from "../lib/tickets";
import { useKeyboardShortcuts } from "../lib/useKeyboardShortcuts";
import NewTicketModal from "./NewTicketModal";
import Toasts from "./Toasts";
import NotificationBell from "./NotificationBell";
import GlobalSearch from "./GlobalSearch";
import CommandPalette from "./CommandPalette";

const ALL = ["admin", "agent", "requester"];
const NAV_GROUPS = [
  { label: "Work", items: [
    { to: "/",        label: "Dashboard", icon: LayoutDashboard, end: true, roles: ALL },
    { to: "/tickets", label: "Tickets",   icon: Inbox,                      roles: ALL },
    { to: "/reports", label: "Reports",   icon: BarChart3,                  roles: ["admin", "agent"] },
  ]},
  { label: "Workspace", items: [
    { to: "/people",   label: "People",       icon: Users,    roles: ["admin", "agent"] },
    { to: "/sla",      label: "SLA policies", icon: Timer,    roles: ["admin"] },
    { to: "/settings", label: "Settings",     icon: Settings, roles: ALL },
  ]},
];


const iconBtn = {
  width: 38, height: 38, borderRadius: 10, border: `1px solid ${C.line}`,
  background: C.surface, cursor: "pointer", color: C.inkSoft, flexShrink: 0,
};


function SidebarInner({ user, signOut, onNavigate }) {
  const connected = useRealtimeStatus();
  const role = (user?.role || "").toLowerCase();
  return (
    <>
      <div className="flex items-center gap-2" style={{ padding: "4px 8px 18px" }}>
        <div className="flex items-center justify-center"
             style={{ width: 30, height: 30, borderRadius: 8, background: C.brand }}>
          <Ticket size={16} color="#fff" />
        </div>
        <span style={{ ...display, fontSize: 18, fontWeight: 600 }}>Triage</span>
      </div>

      <nav className="flex flex-col" style={{ flex: 1, gap: 2 }}>
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((it) => !role || it.roles.includes(role));
          if (items.length === 0) return null;
          return (
            <div key={group.label} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: C.inkFaint, padding: "8px 12px 6px" }}>
                {group.label}
              </div>
              <div className="flex flex-col" style={{ gap: 2 }}>
                {items.map(({ to, label, icon: Icon, end }) => (
                  <NavLink key={to} to={to} end={end} onClick={onNavigate} className="flex items-center gap-3 press"
                    style={({ isActive }) => ({
                      padding: "9px 12px", borderRadius: 10, textDecoration: "none",
                      background: isActive ? C.brandSoft : "transparent",
                      color: isActive ? C.brandDark : C.inkSoft,
                      fontSize: 14.5, fontWeight: isActive ? 600 : 500, ...body,
                    })}
                  >
                    <Icon size={18} /> {label}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="flex items-center gap-3"
           style={{ padding: "10px 8px", borderTop: `1px solid ${C.lineSoft}`, marginTop: 8 }}>
        <div className="flex items-center justify-center"
             style={{ width: 32, height: 32, borderRadius: "50%", background: C.panel, color: "#fff", fontSize: 13, fontWeight: 600 }}>
          {initials(user?.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>{user?.name || "there"}</div>
          <div style={{ fontSize: 12, color: C.inkFaint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {user?.role || "Member"}{user?.company ? ` · ${user.company}` : ""}
          </div>
        </div>
        <button onClick={signOut} title="Sign out" className="press"
                style={{ border: "none", background: "transparent", cursor: "pointer", color: C.inkFaint }}>
          <LogOut size={17} />
        </button>
      </div>

     
      <div className="flex items-center" style={{ gap: 7, padding: "8px 10px 2px", fontSize: 11.5, color: C.inkFaint }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                       background: connected ? "#16A34A" : C.inkFaint,
                       boxShadow: connected ? "0 0 0 3px rgba(22,163,74,.15)" : "none",
                       transition: "background .25s ease" }} />
        <span>Triage v1.0 · {connected ? "Live" : "Offline"}</span>
      </div>
    </>
  );
}

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNew, setShowNew] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showPalette, setShowPalette] = useState(false);

  useKeyboardShortcuts({ onNewTicket: () => setShowNew(true) });

 
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setShowPalette((s) => !s);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex" style={{ minHeight: "100vh", background: C.bg, ...body, color: C.ink }}>
     
      <aside className="hidden md:flex flex-col"
             style={{ width: 232, background: C.surface, borderRight: `1px solid ${C.line}`, padding: "20px 14px" }}>
        <SidebarInner user={user} signOut={signOut} />
      </aside>

      
      {drawerOpen && (
        <div className="md:hidden" style={{ position: "fixed", inset: 0, zIndex: 60 }}>
          <div className="overlay-in" onClick={() => setDrawerOpen(false)}
               style={{ position: "absolute", inset: 0, background: "rgba(15,17,23,.45)" }} />
          <aside className="flex flex-col"
                 style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 252, background: C.surface,
                          borderRight: `1px solid ${C.line}`, padding: "20px 14px",
                          animation: "slideInLeft .26s cubic-bezier(.22,.61,.36,1) both" }}>
            <SidebarInner user={user} signOut={signOut} onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header className="flex items-center justify-between"
                style={{ padding: "14px 16px", background: C.surface, borderBottom: `1px solid ${C.line}`, gap: 12 }}>
          <div className="flex items-center" style={{ gap: 10, flex: 1, minWidth: 0 }}>
            
            <button onClick={() => setDrawerOpen(true)}
                    className="md:hidden flex items-center justify-center press"
                    style={iconBtn}>
              <Menu size={18} />
            </button>
            <GlobalSearch />
          </div>

          <div className="flex items-center gap-3" style={{ flexShrink: 0 }}>
            <button onClick={() => setShowPalette(true)} title="Command palette (⌘K)"
                    className="hidden sm:flex items-center gap-2 press"
                    style={{ height: 38, padding: "0 10px", borderRadius: 10, border: `1px solid ${C.line}`,
                             background: C.surface, cursor: "pointer", color: C.inkFaint, ...body }}>
              <Command size={15} />
              <span style={{ fontSize: 12, fontWeight: 600 }}>K</span>
            </button>
            <button onClick={toggle} title={theme === "dark" ? "Light mode" : "Dark mode"}
                    className="flex items-center justify-center press" style={iconBtn}>
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <NotificationBell />
            <button onClick={() => setShowNew(true)} className="flex items-center gap-2 press"
                    style={{ background: C.brand, color: "#fff", border: "none", borderRadius: 10, padding: "10px 15px", fontSize: 14, fontWeight: 600, cursor: "pointer", ...body }}>
              <Plus size={16} /> <span className="hidden sm:inline">New ticket</span>
            </button>
          </div>
        </header>

      
        <div key={location.pathname.split("/")[1] || "home"} style={{ flex: 1, padding: "clamp(16px, 4vw, 28px)", overflow: "auto" }}>
          <div className="fade-in"><Outlet /></div>
        </div>
      </main>

      <Toasts />

      {showPalette && (
        <CommandPalette
          onClose={() => setShowPalette(false)}
          onNewTicket={() => { setShowPalette(false); setShowNew(true); }}
        />
      )}

      {showNew && (
        <NewTicketModal onClose={() => setShowNew(false)} onCreated={() => navigate("/tickets")} />
      )}
    </div>
  );
}